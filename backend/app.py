import os
import json
import uuid
import traceback
import pickle
import importlib
import shutil
import joblib
from datetime import datetime
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc,
    precision_recall_curve, mean_squared_error, mean_absolute_error,
    r2_score, silhouette_score, explained_variance_score
)

from algorithms_data import (
    get_learning_types, get_algorithms_for_type,
    get_algorithm_by_id, get_model_path
)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
UPLOAD_DIR = os.path.join(PROJECT_DIR, 'uploads')
CHARTS_DIR = os.path.join(PROJECT_DIR, 'results', 'charts')
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets')
MODELS_DIR = os.path.join(PROJECT_DIR, 'results', 'models')
PREDICTIONS_DIR = os.path.join(PROJECT_DIR, 'results', 'predictions')
PREDICTIONS_HISTORY_FILE = os.path.join(PREDICTIONS_DIR, 'prediction_history.json')

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)
os.makedirs(DATASETS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(PREDICTIONS_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'csv', 'xlsx'}
MAX_FILE_SIZE = 200 * 1024 * 1024

sns.set_style('whitegrid')
plt.rcParams['figure.dpi'] = 100


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_dataset_info():
    info_file = os.path.join(DATASETS_DIR, 'dataset_info.json')
    if os.path.exists(info_file):
        with open(info_file, 'r') as f:
            return json.load(f)
    return {}


def save_dataset_info(info):
    info_file = os.path.join(DATASETS_DIR, 'dataset_info.json')
    with open(info_file, 'w') as f:
        json.dump(info, f, indent=2)


def read_dataset(dataset_id):
    info = get_dataset_info()
    ds = info.get(dataset_id)
    if not ds:
        return None, None
    file_path = ds['file_path']
    if not os.path.exists(file_path):
        return None, None
    ext = ds['extension']
    try:
        if ext == 'csv':
            try:
                df = pd.read_csv(file_path, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding='latin-1')
        elif ext == 'xlsx':
            df = pd.read_excel(file_path, engine='openpyxl')
        else:
            return None, None
        return df, ds
    except Exception:
        return None, None


def compute_health_score(df):
    total_cells = df.shape[0] * df.shape[1]
    missing_cells = int(df.isnull().sum().sum())
    duplicate_rows = int(df.duplicated().sum())
    empty_columns = int((df.isnull().all()).sum())

    missing_ratio = missing_cells / total_cells if total_cells > 0 else 0
    duplicate_ratio = duplicate_rows / df.shape[0] if df.shape[0] > 0 else 0
    empty_ratio = empty_columns / df.shape[1] if df.shape[1] > 0 else 0

    missing_penalty = missing_ratio * 40
    duplicate_penalty = duplicate_ratio * 30
    empty_penalty = empty_ratio * 30

    score = round(max(0, 100 - missing_penalty - duplicate_penalty - empty_penalty), 1)

    if score >= 90:
        label = 'Excellent'
    elif score >= 70:
        label = 'Good'
    elif score >= 50:
        label = 'Average'
    else:
        label = 'Poor'

    return {
        'score': score,
        'label': label,
        'missing_penalty': round(missing_penalty, 1),
        'duplicate_penalty': round(duplicate_penalty, 1),
        'empty_penalty': round(empty_penalty, 1),
        'missing_cells': missing_cells,
        'total_cells': total_cells,
        'duplicate_rows': duplicate_rows,
        'empty_columns': empty_columns
    }


def detect_column_types(df):
    types = {}
    for col in df.columns:
        dtype = df[col].dtype
        if pd.api.types.is_bool_dtype(dtype):
            types[col] = 'Boolean'
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            types[col] = 'Datetime'
        elif pd.api.types.is_numeric_dtype(dtype):
            types[col] = 'Numeric'
        elif pd.api.types.is_categorical_dtype(dtype) or dtype == 'object':
            unique_ratio = df[col].nunique() / len(df) if len(df) > 0 else 0
            if unique_ratio <= 0.05 or df[col].nunique() <= 10:
                types[col] = 'Categorical'
            else:
                types[col] = 'Text'
        else:
            types[col] = 'Other'
    return types


@app.route('/')
def home():
    return 'Machine Learning for You API Running'


@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Unsupported file format. Please upload CSV or Excel (.xlsx) files only.'}), 400

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size == 0:
        return jsonify({'error': 'Uploaded file is empty.'}), 400

    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large. Maximum size is 200MB.'}), 400

    filename = file.filename
    ext = filename.rsplit('.', 1)[1].lower()
    dataset_id = str(uuid.uuid4())[:8]
    safe_name = f"{dataset_id}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    try:
        file.save(file_path)
    except Exception:
        return jsonify({'error': 'Failed to save uploaded file.'}), 500

    try:
        if ext == 'csv':
            df = pd.read_csv(file_path, encoding='utf-8', nrows=5)
        else:
            df = pd.read_excel(file_path, engine='openpyxl', nrows=5)
    except Exception:
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({'error': 'Corrupted or unreadable file.'}), 400

    ds_info = {
        'dataset_id': dataset_id,
        'filename': filename,
        'file_path': file_path,
        'extension': ext,
        'file_size': file_size,
        'uploaded_at': pd.Timestamp.now().isoformat()
    }

    info = get_dataset_info()
    info[dataset_id] = ds_info
    save_dataset_info(info)

    return jsonify({
        'dataset_id': dataset_id,
        'filename': filename,
        'file_size': file_size,
        'extension': ext,
        'message': 'File uploaded successfully'
    })


@app.route('/api/dataset/<dataset_id>/preview', methods=['GET'])
def dataset_preview(dataset_id):
    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Dataset not found'}), 404

    columns = list(df.columns)
    preview = df.head(10).fillna('').replace([np.inf, -np.inf], '').map(
        lambda x: x.isoformat() if isinstance(x, pd.Timestamp) else x
    ).to_dict('records')

    return jsonify({
        'columns': columns,
        'rows': preview,
        'total_rows': len(df),
        'total_columns': len(columns)
    })


@app.route('/api/dataset/<dataset_id>/summary', methods=['GET'])
def dataset_summary(dataset_id):
    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Dataset not found'}), 404

    columns = list(df.columns)
    types = detect_column_types(df)

    numeric_cols = [col for col, t in types.items() if t == 'Numeric']
    categorical_cols = [col for col, t in types.items() if t == 'Categorical']

    memory_usage = df.memory_usage(deep=True).sum()
    if memory_usage < 1024:
        mem_str = f"{memory_usage} B"
    elif memory_usage < 1024 * 1024:
        mem_str = f"{memory_usage / 1024:.1f} KB"
    else:
        mem_str = f"{memory_usage / (1024 * 1024):.1f} MB"

    file_size = ds['file_size']
    if file_size < 1024:
        size_str = f"{file_size} B"
    elif file_size < 1024 * 1024:
        size_str = f"{file_size / 1024:.1f} KB"
    else:
        size_str = f"{file_size / (1024 * 1024):.1f} MB"

    missing_values = int(df.isnull().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    return jsonify({
        'dataset_name': ds['filename'],
        'file_size': size_str,
        'rows': len(df),
        'columns': len(columns),
        'memory_usage': mem_str,
        'numeric_columns': len(numeric_cols),
        'categorical_columns': len(categorical_cols),
        'missing_values': missing_values,
        'duplicate_rows': duplicate_rows,
        'health_score': compute_health_score(df)
    })


@app.route('/api/dataset/<dataset_id>/column/<column_name>', methods=['GET'])
def column_stats(dataset_id, column_name):
    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Dataset not found'}), 404

    if column_name not in df.columns:
        return jsonify({'error': 'Column not found'}), 404

    series = df[column_name]
    dtype = str(series.dtype)
    null_count = int(series.isnull().sum())
    unique_count = int(series.nunique())

    stats = {
        'name': column_name,
        'dtype': dtype,
        'null_count': null_count,
        'unique_count': unique_count
    }

    if pd.api.types.is_numeric_dtype(series):
        stats['mean'] = round(series.mean(), 4) if not series.isnull().all() else None
        stats['median'] = round(series.median(), 4) if not series.isnull().all() else None
        stats['min'] = round(series.min(), 4) if not series.isnull().all() else None
        stats['max'] = round(series.max(), 4) if not series.isnull().all() else None
        mode_vals = series.dropna().mode()
        stats['mode'] = list(mode_vals.head(5).round(4).tolist()) if len(mode_vals) > 0 else []
    else:
        stats['mean'] = None
        stats['median'] = None
        stats['min'] = None
        stats['max'] = None
        mode_vals = series.dropna().mode()
        stats['mode'] = list(mode_vals.head(5).tolist()) if len(mode_vals) > 0 else []

    return jsonify(stats)


@app.route('/api/dataset/<dataset_id>/analysis', methods=['GET'])
def dataset_analysis(dataset_id):
    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Dataset not found'}), 404

    types = detect_column_types(df)
    missing_values = df.isnull().sum().to_dict()
    missing_values = {str(k): int(v) for k, v in missing_values.items()}
    missing_percent = df.isnull().sum() / len(df) * 100
    missing_percent = {str(k): round(float(v), 2) for k, v in missing_percent.items()}

    duplicate_rows = int(df.duplicated().sum())
    duplicate_df = df[df.duplicated(keep=False)] if duplicate_rows > 0 else pd.DataFrame()

    return jsonify({
        'columns': list(df.columns),
        'column_types': types,
        'missing_values': missing_values,
        'missing_percent': missing_percent,
        'duplicate_rows': duplicate_rows,
        'total_rows': len(df)
    })


@app.route('/api/dataset/<dataset_id>/visualizations', methods=['GET'])
def dataset_visualizations(dataset_id):
    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Dataset not found'}), 404

    types = detect_column_types(df)
    numeric_cols = [col for col, t in types.items() if t == 'Numeric']
    categorical_cols = [col for col, t in types.items() if t == 'Categorical']

    prefix = dataset_id

    # 1. Missing values chart
    fig1, ax1 = plt.subplots(figsize=(10, 5))
    missing_df = df.isnull().sum()
    missing_df = missing_df[missing_df > 0]
    if len(missing_df) > 0:
        colors = plt.cm.OrRd(missing_df.values / max(missing_df.values))
        missing_df.plot(kind='bar', ax=ax1, color=colors, edgecolor='white')
        ax1.set_title('Missing Values by Column', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Columns')
        ax1.set_ylabel('Missing Count')
        ax1.tick_params(axis='x', rotation=45)
        for i, v in enumerate(missing_df.values):
            ax1.text(i, v + 0.1, str(v), ha='center', fontsize=9)
    else:
        ax1.text(0.5, 0.5, 'No missing values found', ha='center', va='center',
                 fontsize=14, transform=ax1.transAxes)
        ax1.set_title('Missing Values', fontsize=14, fontweight='bold')
    plt.tight_layout()
    missing_path = os.path.join(CHARTS_DIR, f'{prefix}_missing_values.png')
    fig1.savefig(missing_path, bbox_inches='tight', dpi=100)
    plt.close(fig1)

    # 2. Correlation heatmap
    fig2, ax2 = plt.subplots(figsize=(10, 8))
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr()
        mask = np.triu(np.ones_like(corr, dtype=bool))
        sns.heatmap(corr, mask=mask, annot=True, fmt='.2f', cmap='RdBu_r',
                    center=0, square=True, linewidths=0.5, ax=ax2,
                    cbar_kws={'shrink': 0.8})
        ax2.set_title('Correlation Heatmap (Numeric Columns)', fontsize=14, fontweight='bold')
    else:
        ax2.text(0.5, 0.5, 'Need at least 2 numeric columns\nfor correlation heatmap',
                 ha='center', va='center', fontsize=14, transform=ax2.transAxes)
        ax2.set_title('Correlation Heatmap', fontsize=14, fontweight='bold')
    plt.tight_layout()
    corr_path = os.path.join(CHARTS_DIR, f'{prefix}_correlation.png')
    fig2.savefig(corr_path, bbox_inches='tight', dpi=100)
    plt.close(fig2)

    # 3. Histograms for numeric columns
    hist_paths = []
    if numeric_cols:
        cols_per_fig = 4
        for i in range(0, len(numeric_cols), cols_per_fig):
            batch = numeric_cols[i:i + cols_per_fig]
            fig3, axes = plt.subplots(1, len(batch), figsize=(5 * len(batch), 4))
            if len(batch) == 1:
                axes = [axes]
            for ax, col in zip(axes, batch):
                series = df[col].dropna()
                ax.hist(series, bins=30, color='#2E5AAC', edgecolor='white', alpha=0.8)
                ax.set_title(col, fontsize=11, fontweight='bold')
                ax.set_xlabel('Value')
                ax.set_ylabel('Frequency')
            plt.tight_layout()
            hist_path = os.path.join(CHARTS_DIR, f'{prefix}_hist_{i}.png')
            fig3.savefig(hist_path, bbox_inches='tight', dpi=100)
            plt.close(fig3)
            hist_paths.append(f'/charts/{prefix}_hist_{i}.png')
    else:
        fig3, ax3 = plt.subplots(figsize=(6, 4))
        ax3.text(0.5, 0.5, 'No numeric columns found', ha='center', va='center',
                 fontsize=14, transform=ax3.transAxes)
        ax3.set_title('Histograms', fontsize=14, fontweight='bold')
        plt.tight_layout()
        hist_path = os.path.join(CHARTS_DIR, f'{prefix}_hist_none.png')
        fig3.savefig(hist_path, bbox_inches='tight', dpi=100)
        plt.close(fig3)
        hist_paths.append(f'/charts/{prefix}_hist_none.png')

    # 4. Bar charts for categorical columns
    bar_paths = []
    if categorical_cols:
        cols_per_fig = 3
        for i in range(0, len(categorical_cols), cols_per_fig):
            batch = categorical_cols[i:i + cols_per_fig]
            fig4, axes = plt.subplots(1, len(batch), figsize=(6 * len(batch), 5))
            if len(batch) == 1:
                axes = [axes]
            for ax, col in zip(axes, batch):
                value_counts = df[col].value_counts().head(15)
                colors = plt.cm.Set2(range(len(value_counts)))
                bars = value_counts.plot(kind='bar', ax=ax, color=colors, edgecolor='white')
                ax.set_title(col, fontsize=11, fontweight='bold')
                ax.set_xlabel('Category')
                ax.set_ylabel('Count')
                ax.tick_params(axis='x', rotation=45)
                for j, v in enumerate(value_counts.values):
                    ax.text(j, v + 0.1, str(v), ha='center', fontsize=8)
            plt.tight_layout()
            bar_path = os.path.join(CHARTS_DIR, f'{prefix}_bar_{i}.png')
            fig4.savefig(bar_path, bbox_inches='tight', dpi=100)
            plt.close(fig4)
            bar_paths.append(f'/charts/{prefix}_bar_{i}.png')
    else:
        fig4, ax4 = plt.subplots(figsize=(6, 4))
        ax4.text(0.5, 0.5, 'No categorical columns found', ha='center', va='center',
                 fontsize=14, transform=ax4.transAxes)
        ax4.set_title('Bar Charts', fontsize=14, fontweight='bold')
        plt.tight_layout()
        bar_path = os.path.join(CHARTS_DIR, f'{prefix}_bar_none.png')
        fig4.savefig(bar_path, bbox_inches='tight', dpi=100)
        plt.close(fig4)
        bar_paths.append(f'/charts/{prefix}_bar_none.png')

    return jsonify({
        'missing_values_chart': f'/charts/{prefix}_missing_values.png',
        'correlation_heatmap': f'/charts/{prefix}_correlation.png',
        'histograms': hist_paths,
        'bar_charts': bar_paths
    })


@app.route('/charts/<filename>')
def serve_chart(filename):
    from flask import send_from_directory
    return send_from_directory(CHARTS_DIR, filename)


@app.route('/api/dataset/<dataset_id>/target', methods=['POST'])
def set_target_column(dataset_id):
    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Dataset not found'}), 404

    data = request.get_json()
    if not data or 'target_column' not in data:
        return jsonify({'error': 'No target column provided'}), 400

    target = data['target_column']
    if target not in df.columns:
        return jsonify({'error': f'Column "{target}" not found in dataset'}), 400

    info = get_dataset_info()
    if dataset_id in info:
        info[dataset_id]['target_column'] = target
        save_dataset_info(info)

    return jsonify({
        'message': f'Target column set to "{target}"',
        'target_column': target
    })


@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    info = get_dataset_info()
    datasets = []
    for ds_id, ds_info in info.items():
        datasets.append({
            'dataset_id': ds_id,
            'filename': ds_info['filename'],
            'file_size': ds_info['file_size'],
            'uploaded_at': ds_info.get('uploaded_at', ''),
            'target_column': ds_info.get('target_column', None)
        })
    datasets.sort(key=lambda x: x['uploaded_at'], reverse=True)
    return jsonify(datasets)


@app.route('/api/algorithms', methods=['GET'])
def list_learning_types():
    return jsonify(get_learning_types())


@app.route('/api/algorithms/<learning_type>', methods=['GET'])
def list_algorithms(learning_type):
    result = get_algorithms_for_type(learning_type)
    if result is None:
        return jsonify({'error': 'Invalid learning type'}), 404
    return jsonify(result)


@app.route('/api/train', methods=['POST'])
def train_model():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    dataset_id = data.get('dataset_id')
    algorithm_id = data.get('algorithm_id')
    target_column = data.get('target_column')
    test_size = float(data.get('test_size', 0.2))
    random_state = data.get('random_state')
    if random_state is not None:
        random_state = int(random_state)

    if not dataset_id or not algorithm_id:
        return jsonify({'error': 'dataset_id and algorithm_id are required'}), 400

    algo = get_algorithm_by_id(algorithm_id)
    if not algo:
        return jsonify({'error': f'Algorithm "{algorithm_id}" not found'}), 404

    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Dataset not found'}), 404

    task = algo['task']
    model_id = str(uuid.uuid4())[:12]

    dataset_name = ds.get('filename', dataset_id)

    # --- UNSUPERVISED: No target column needed ---
    if task in ('clustering', 'dim_reduction', 'anomaly', 'association'):
        X = df.select_dtypes(include=[np.number]).dropna(axis=1, how='all')
        if X.shape[1] == 0:
            return jsonify({'error': 'No numeric features available for unsupervised learning'}), 400
        return _run_unsupervised(algo, X, task, random_state, model_id, target_column, dataset_id, dataset_name)

    # --- SUPERVISED / SEMI-SUPERVISED: Need target column ---
    if not target_column:
        return jsonify({'error': 'target_column is required for this algorithm'}), 400
    if target_column not in df.columns:
        return jsonify({'error': f'Column "{target_column}" not found in dataset'}), 400

    X = df.drop(columns=[target_column]).select_dtypes(include=[np.number])
    if X.shape[1] == 0:
        return jsonify({'error': 'No numeric feature columns available (all non-numeric except target)'}), 400

    y_raw = df[target_column]

    le = None
    if y_raw.dtype == 'object' or y_raw.dtype.name == 'category':
        le = LabelEncoder()
        y = le.fit_transform(y_raw)
        target_classes = le.classes_.tolist()
    else:
        y = y_raw.values
        target_classes = None

    if task == 'semi_supervised':
        return _run_semi_supervised(algo, X, y, le, target_classes, random_state, model_id, target_column, dataset_id, dataset_name)
    else:
        return _run_supervised(algo, X, y, le, target_classes, test_size, random_state, model_id, target_column, dataset_id, dataset_name)


def _import_model_class(algo):
    """Dynamically import the model class for the algorithm."""
    module_path = algo['module']
    class_name = algo['class_name']
    mod = importlib.import_module(module_path)
    cls = getattr(mod, class_name)
    return cls


def _try_load_model(algo):
    """Try to load a pre-trained .pkl model."""
    pkl_path = get_model_path(algo['id'])
    if pkl_path and os.path.exists(pkl_path):
        try:
            with open(pkl_path, 'rb') as f:
                model = pickle.load(f)
            return model
        except Exception:
            return None
    return None


def _save_trained_model(model, model_id, algo, metadata):
    """Save a trained model and its metadata."""
    model_dir = os.path.join(MODELS_DIR, model_id)
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'model.pkl')
    joblib.dump(model, model_path)
    metadata['model_id'] = model_id
    metadata['model_path'] = f'/api/models/{model_id}/download'
    with open(os.path.join(model_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2, default=str)


def _run_supervised(algo, X, y, le, target_classes, test_size, random_state, model_id, target_column, dataset_id=None, dataset_name=None):
    """Train/evaluate a supervised learning model."""
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        model = _try_load_model(algo)
        if model is None:
            cls = _import_model_class(algo)
            params = algo.get('params', {}).copy()
            model = cls(**params)
            model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        is_classification = algo['task'] == 'classification'
        results = {'algorithm': algo['name'], 'task': algo['task']}

        if is_classification:
            unique_classes = len(np.unique(y))
            avg = 'binary' if unique_classes == 2 else 'weighted'

            results['metrics'] = {
                'accuracy': round(float(accuracy_score(y_test, y_pred)), 4),
                'precision': round(float(precision_score(y_test, y_pred, average=avg, zero_division=0)), 4),
                'recall': round(float(recall_score(y_test, y_pred, average=avg, zero_division=0)), 4),
                'f1_score': round(float(f1_score(y_test, y_pred, average=avg, zero_division=0)), 4),
            }
            cm = confusion_matrix(y_test, y_pred).tolist()
            results['confusion_matrix'] = cm
            results['label'] = f"{results['metrics']['accuracy'] * 100:.1f}% Accuracy"
            results['label_color'] = 'green' if results['metrics']['accuracy'] >= 0.8 else ('yellow' if results['metrics']['accuracy'] >= 0.6 else 'red')
        else:
            mse = mean_squared_error(y_test, y_pred)
            results['metrics'] = {
                'mse': round(float(mse), 4),
                'rmse': round(float(np.sqrt(mse)), 4),
                'mae': round(float(mean_absolute_error(y_test, y_pred)), 4),
                'r2_score': round(float(r2_score(y_test, y_pred)), 4),
                'explained_variance': round(float(explained_variance_score(y_test, y_pred)), 4),
            }
            results['label'] = f"R² = {results['metrics']['r2_score']:.3f}"
            results['label_color'] = 'green' if results['metrics']['r2_score'] >= 0.7 else ('yellow' if results['metrics']['r2_score'] >= 0.4 else 'red')

        results['test_size'] = len(y_test)
        results['train_size'] = len(y_train)
        results['features'] = list(X.columns)

        # Save model
        metadata = {
            'algorithm': algo['name'],
            'algorithm_id': algo['id'],
            'task': algo['task'],
            'target_column': target_column,
            'dataset_id': dataset_id,
            'dataset_name': dataset_name,
            'features': list(X.columns),
            'has_label_encoder': le is not None,
            'target_classes': target_classes,
            'metrics': results.get('metrics'),
            'label': results.get('label'),
            'created_at': datetime.now().isoformat()
        }
        _save_trained_model(model, model_id, algo, metadata)
        results['model_id'] = model_id

        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'Training failed: {str(e)}', 'traceback': traceback.format_exc()}), 500


def _run_semi_supervised(algo, X, y, le, target_classes, random_state, model_id, target_column, dataset_id=None, dataset_name=None):
    """Train/evaluate a semi-supervised learning model."""
    try:
        labeled_mask = y != -1
        if labeled_mask.sum() == 0:
            return jsonify({'error': 'No labeled data found. Set some target values and mark unlabeled as -1.'}), 400

        X_labeled = X[labeled_mask]
        y_labeled = y[labeled_mask]

        cls = _import_model_class(algo)
        base_params = algo.get('params', {}).copy()

        algo_id = algo['id']
        if algo_id == 'self-training-rf':
            from sklearn.ensemble import RandomForestClassifier
            estimator = RandomForestClassifier(**{k: v for k, v in base_params.items() if k != 'threshold' and k != 'max_iter'})
            model = cls(estimator=estimator, threshold=base_params.get('threshold', 0.75), max_iter=base_params.get('max_iter', 10))
            model.fit(X, y)
            y_pred_labeled = model.predict(X_labeled)
        elif algo_id == 'semi-supervised-svm':
            from sklearn.svm import SVC
            svm_params = {k: v for k, v in base_params.items() if k != 'threshold' and k != 'max_iter'}
            estimator = SVC(probability=True, **svm_params)
            model = cls(estimator=estimator, threshold=base_params.get('threshold', 0.75), max_iter=base_params.get('max_iter', 10))
            model.fit(X, y)
            y_pred_labeled = model.predict(X_labeled)
        elif algo_id in ('co-training', 'pseudo-labeling'):
            model = cls(**base_params)
            model.fit(X_labeled, y_labeled)
            y_pred_labeled = model.predict(X_labeled)
        else:
            model = cls(**base_params)
            model.fit(X, y)
            y_pred_labeled = model.predict(X_labeled)

        unique_classes = len(np.unique(y_labeled))
        avg = 'binary' if unique_classes == 2 else 'weighted'

        results = {
            'algorithm': algo['name'],
            'task': 'semi_supervised',
            'metrics': {
                'accuracy': round(float(accuracy_score(y_labeled, y_pred_labeled)), 4),
                'precision': round(float(precision_score(y_labeled, y_pred_labeled, average=avg, zero_division=0)), 4),
                'recall': round(float(recall_score(y_labeled, y_pred_labeled, average=avg, zero_division=0)), 4),
                'f1_score': round(float(f1_score(y_labeled, y_pred_labeled, average=avg, zero_division=0)), 4),
            },
            'total_samples': len(y),
            'labeled_samples': int(labeled_mask.sum()),
            'unlabeled_samples': int((~labeled_mask).sum()),
            'features': list(X.columns)
        }

        if unique_classes == 2:
            cm = confusion_matrix(y_labeled, y_pred_labeled).tolist()
            results['confusion_matrix'] = cm

        if target_classes is not None:
            results['target_classes'] = target_classes

        acc = results['metrics']['accuracy']
        results['label'] = f"{acc * 100:.1f}% Accuracy"
        results['label_color'] = 'green' if acc >= 0.8 else ('yellow' if acc >= 0.6 else 'red')

        metadata = {
            'algorithm': algo['name'],
            'algorithm_id': algo['id'],
            'task': 'semi_supervised',
            'target_column': target_column,
            'dataset_id': dataset_id,
            'dataset_name': dataset_name,
            'features': list(X.columns),
            'has_label_encoder': le is not None,
            'target_classes': target_classes,
            'metrics': results.get('metrics'),
            'label': results.get('label'),
            'created_at': datetime.now().isoformat()
        }
        _save_trained_model(model, model_id, algo, metadata)
        results['model_id'] = model_id

        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'Semi-supervised training failed: {str(e)}', 'traceback': traceback.format_exc()}), 500


def _run_unsupervised(algo, X, task, random_state, model_id=None, target_column=None, dataset_id=None, dataset_name=None):
    """Run an unsupervised learning algorithm."""
    try:
        cls = _import_model_class(algo)
        params = algo.get('params', {}).copy()

        if random_state is not None and 'random_state' in params:
            params['random_state'] = random_state

        results = {'algorithm': algo['name'], 'task': task, 'features': list(X.columns)}

        if task == 'clustering':
            if algo['id'] == 'dbscan':
                model = cls(**params)
                labels = model.fit_predict(X)
                n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
                n_noise = int((labels == -1).sum())
                results['n_clusters'] = n_clusters
                results['n_noise'] = n_noise
                results['labels'] = labels.tolist()
                if n_clusters > 1:
                    sil = round(float(silhouette_score(X, labels)), 4)
                    results['silhouette_score'] = sil
                    results['label'] = f"{n_clusters} clusters, Silhouette: {sil}"
                else:
                    results['silhouette_score'] = None
                    results['label'] = f"{n_clusters} cluster(s), {n_noise} noise points"
                results['label_color'] = 'green' if n_clusters > 1 else 'yellow'
            else:
                model = cls(**params)
                labels = model.fit_predict(X)
                n_clusters = len(set(labels))
                results['n_clusters'] = n_clusters
                if n_clusters > 1:
                    sil = round(float(silhouette_score(X, labels)), 4)
                    results['silhouette_score'] = sil
                    results['label'] = f"{n_clusters} clusters, Silhouette: {sil}"
                else:
                    results['silhouette_score'] = None
                    results['label'] = f"{n_clusters} cluster(s)"
                results['label_color'] = 'green' if n_clusters > 1 else 'yellow'
                if hasattr(model, 'inertia_'):
                    results['inertia'] = round(float(model.inertia_), 2)

        elif task == 'dim_reduction':
            model = cls(**params)
            transformed = model.fit_transform(X)
            results['original_dimensions'] = X.shape[1]
            results['reduced_dimensions'] = transformed.shape[1]
            results['total_samples'] = len(X)
            if algo['id'] == 'pca':
                var_ratio = model.explained_variance_ratio_.tolist()
                results['explained_variance_ratio'] = [round(v, 4) for v in var_ratio]
                results['cumulative_variance'] = round(float(np.cumsum(var_ratio)[-1]), 4)
                results['label'] = f"{transformed.shape[1]} components, {results['cumulative_variance'] * 100:.1f}% variance"
            else:
                results['label'] = f"Reduced to {transformed.shape[1]} dimensions"
            results['label_color'] = 'green'

        elif task == 'anomaly':
            model = cls(**params)
            preds = model.fit_predict(X)
            n_outliers = int((preds == -1).sum())
            n_inliers = int((preds == 1).sum())
            results['total_samples'] = len(X)
            results['outliers_detected'] = n_outliers
            results['inliers'] = n_inliers
            results['outlier_percentage'] = round(n_outliers / len(X) * 100, 2)
            results['label'] = f"{n_outliers} outliers ({results['outlier_percentage']:.1f}%)"
            results['label_color'] = 'green' if results['outlier_percentage'] < 10 else 'yellow'

        elif task == 'association':
            return jsonify({'algorithm': algo['name'], 'task': 'association', 'message': 'Apriori runs on transaction data. Please use a dataset with basket format.', 'label': 'See docs', 'label_color': 'yellow'})

        if model_id and 'model' in dir():
            metadata = {
                'algorithm': algo['name'],
                'algorithm_id': algo['id'],
                'task': task,
                'target_column': target_column,
                'dataset_id': dataset_id,
                'dataset_name': dataset_name,
                'features': list(X.columns),
                'has_label_encoder': False,
                'target_classes': None,
                'metrics': {k: v for k, v in results.items() if k not in ('algorithm', 'task', 'features', 'label', 'label_color')},
                'label': results.get('label'),
                'created_at': datetime.now().isoformat()
            }
            _save_trained_model(model, model_id, algo, metadata)
            results['model_id'] = model_id

        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'Unsupervised learning failed: {str(e)}', 'traceback': traceback.format_exc()}), 500


# ---------------------------------------------------------------------------
# Model & Prediction Endpoints
# ---------------------------------------------------------------------------

def load_model_metadata(model_id):
    """Load a saved model's metadata."""
    model_dir = os.path.join(MODELS_DIR, model_id)
    meta_path = os.path.join(model_dir, 'metadata.json')
    model_path = os.path.join(model_dir, 'model.pkl')
    if not os.path.exists(meta_path) or not os.path.exists(model_path):
        return None, None
    with open(meta_path, 'r') as f:
        metadata = json.load(f)
    model = joblib.load(model_path)
    return model, metadata


def get_prediction_history():
    """Load prediction history from JSON file."""
    if os.path.exists(PREDICTIONS_HISTORY_FILE):
        with open(PREDICTIONS_HISTORY_FILE, 'r') as f:
            return json.load(f)
    return []


def save_prediction_history(history):
    """Save prediction history to JSON file."""
    with open(PREDICTIONS_HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2, default=str)


@app.route('/api/models', methods=['GET'])
def list_models():
    """List all trained models."""
    if not os.path.exists(MODELS_DIR):
        return jsonify({'models': []})
    models = []
    for name in os.listdir(MODELS_DIR):
        meta_path = os.path.join(MODELS_DIR, name, 'metadata.json')
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as f:
                meta = json.load(f)
            meta['model_id'] = name
            models.append(meta)
    models.sort(key=lambda m: m.get('created_at', ''), reverse=True)
    return jsonify({'models': models})


@app.route('/api/models/<model_id>/download', methods=['GET'])
def download_model(model_id):
    """Download a saved model file."""
    model_dir = os.path.join(MODELS_DIR, model_id)
    if not os.path.exists(model_dir):
        return jsonify({'error': 'Model not found'}), 404
    return send_from_directory(model_dir, 'model.pkl', as_attachment=True, download_name=f'{model_id}.pkl')


@app.route('/api/models/<model_id>', methods=['DELETE'])
def delete_model(model_id):
    """Delete a saved model and its directory."""
    model_dir = os.path.join(MODELS_DIR, model_id)
    if not os.path.exists(model_dir):
        return jsonify({'error': 'Model not found'}), 404
    try:
        shutil.rmtree(model_dir)
        return jsonify({'message': f'Model {model_id} deleted successfully'})
    except Exception as e:
        return jsonify({'error': f'Failed to delete model: {str(e)}'}), 500


@app.route('/api/predict', methods=['POST'])
def predict():
    """Make predictions with a saved model on uploaded data."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        model_id = request.form.get('model_id')
        if not model_id:
            return jsonify({'error': 'model_id is required'}), 400

        model, metadata = load_model_metadata(model_id)
        if model is None:
            return jsonify({'error': 'Model not found'}), 404

        file = request.files['file']
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'csv'
        if ext == 'csv':
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file, engine='openpyxl')

        features = metadata.get('features', [])
        missing = [c for c in features if c not in df.columns]
        if missing:
            return jsonify({'error': f'Missing required feature columns: {", ".join(missing)}'}), 400

        X_pred = df[features].select_dtypes(include=[np.number]).fillna(0)

        predictions = model.predict(X_pred)
        pred_column = metadata.get('target_column', 'prediction')

        # Decode if label encoder was used
        target_classes = metadata.get('target_classes')
        if target_classes and metadata.get('has_label_encoder'):
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            le.classes_ = np.array(target_classes)
            decoded = le.inverse_transform(predictions.astype(int))
            result_df = df.copy()
            result_df[pred_column] = decoded
            predictions_display = decoded.tolist()
        else:
            result_df = df.copy()
            result_df[pred_column] = predictions
            predictions_display = [round(float(p), 4) if isinstance(p, (np.floating, float)) else int(p) if isinstance(p, (np.integer, int)) else str(p) for p in predictions]

        pred_id = str(uuid.uuid4())[:8]
        pred_dir = os.path.join(PREDICTIONS_DIR, pred_id)
        os.makedirs(pred_dir, exist_ok=True)
        csv_path = os.path.join(pred_dir, 'predictions.csv')
        result_df.to_csv(csv_path, index=False)

        history = get_prediction_history()
        history.append({
            'prediction_id': pred_id,
            'model_id': model_id,
            'algorithm': metadata.get('algorithm', 'Unknown'),
            'task': metadata.get('task', 'Unknown'),
            'filename': file.filename,
            'num_predictions': len(predictions),
            'created_at': datetime.now().isoformat()
        })
        save_prediction_history(history)

        return jsonify({
            'prediction_id': pred_id,
            'predictions': predictions_display[:100],
            'total_predictions': len(predictions),
            'columns': list(result_df.columns),
            'preview': result_df.head(20).fillna('').replace([np.inf, -np.inf], '').map(
                lambda x: x.isoformat() if isinstance(x, pd.Timestamp) else x
            ).to_dict('records'),
            'download_url': f'/api/predictions/{pred_id}/download'
        })

    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}', 'traceback': traceback.format_exc()}), 500


@app.route('/api/predictions', methods=['GET'])
def list_predictions():
    """List all prediction runs."""
    history = get_prediction_history()
    history.sort(key=lambda p: p.get('created_at', ''), reverse=True)
    return jsonify({'predictions': history})


@app.route('/api/predictions/<prediction_id>/download', methods=['GET'])
def download_predictions(prediction_id):
    """Download prediction results CSV."""
    pred_dir = os.path.join(PREDICTIONS_DIR, prediction_id)
    if not os.path.exists(pred_dir):
        return jsonify({'error': 'Prediction results not found'}), 404
    return send_from_directory(pred_dir, 'predictions.csv', as_attachment=True, download_name=f'predictions_{prediction_id}.csv')


# ---------------------------------------------------------------------------
# Visualization & Reporting Endpoints
# ---------------------------------------------------------------------------

@app.route('/api/dataset/<dataset_id>/eda', methods=['GET'])
def dataset_eda(dataset_id):
    """Return EDA data for interactive charts."""
    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Dataset not found'}), 404

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

    # Histogram data: bin edges + counts for each numeric column
    histograms = {}
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) > 1:
            counts, edges = np.histogram(col_data, bins='auto')
            histograms[col] = {
                'bins': edges.tolist(),
                'counts': counts.tolist()
            }

    # Box plot data: quartiles and outliers for each numeric column
    box_plots = {}
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) > 1:
            q1 = float(col_data.quantile(0.25))
            q3 = float(col_data.quantile(0.75))
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            outliers = col_data[(col_data < lower) | (col_data > upper)].tolist()
            box_plots[col] = {
                'min': float(col_data.min()),
                'q1': q1,
                'median': float(col_data.median()),
                'q3': q3,
                'max': float(col_data.max()),
                'mean': float(col_data.mean()),
                'std': float(col_data.std()),
                'outliers': [round(float(o), 4) for o in outliers[:100]]
            }

    # Correlation heatmap data
    corr_matrix = None
    if len(numeric_cols) > 1:
        corr_df = df[numeric_cols].corr()
        corr_matrix = {
            'columns': numeric_cols,
            'values': [[round(float(v), 4) for v in row] for row in corr_df.values]
        }

    # Class distribution for categorical columns
    class_distributions = {}
    for col in categorical_cols:
        dist = df[col].value_counts().head(20)
        class_distributions[col] = {
            'labels': dist.index.tolist(),
            'counts': dist.values.tolist()
        }

    # Missing values
    missing = {
        col: int(df[col].isnull().sum()) for col in df.columns
        if df[col].isnull().sum() > 0
    }

    return jsonify({
        'dataset_id': dataset_id,
        'dataset_name': ds.get('filename', dataset_id),
        'total_rows': len(df),
        'total_columns': len(df.columns),
        'numeric_columns': numeric_cols,
        'categorical_columns': categorical_cols,
        'histograms': histograms,
        'box_plots': box_plots,
        'correlation': corr_matrix,
        'class_distributions': class_distributions,
        'missing_values': missing
    })


@app.route('/api/model/<model_id>/evaluation', methods=['GET'])
def model_evaluation(model_id):
    """Return evaluation chart data for a trained model."""
    model, metadata = load_model_metadata(model_id)
    if model is None:
        return jsonify({'error': 'Model not found'}), 404

    # Reconstruct training data from dataset
    dataset_id = metadata.get('dataset_id')
    if not dataset_id:
        return jsonify({'error': 'Dataset reference not found in model metadata'}), 400

    df, ds = read_dataset(dataset_id)
    if df is None:
        return jsonify({'error': 'Original dataset not found'}), 404

    features = metadata.get('features', [])
    target_col = metadata.get('target_column')
    task = metadata.get('task', '')

    missing_features = [c for c in features if c not in df.columns]
    if missing_features:
        return jsonify({'error': f'Missing feature columns: {", ".join(missing_features)}'}), 400

    X = df[features].select_dtypes(include=[np.number]).fillna(0)
    result = {'algorithm': metadata.get('algorithm'), 'task': task, 'model_id': model_id}

    # --- CLASSIFICATION evaluation ---
    if task == 'classification' and target_col:
        y_true = df[target_col]
        if metadata.get('has_label_encoder') and metadata.get('target_classes'):
            le = LabelEncoder()
            le.classes_ = np.array(metadata['target_classes'])
            y_true_encoded = le.transform(y_true.astype(str))
        else:
            y_true_encoded = y_true.values

        # Ensure X aligns with y_true
        min_len = min(len(X), len(y_true_encoded))
        X_eval = X.iloc[:min_len]
        y_true_eval = y_true_encoded[:min_len]

        try:
            y_scores = model.predict_proba(X_eval)
            y_pred = model.predict(X_eval)

            # Confusion matrix
            cm = confusion_matrix(y_true_eval, y_pred).tolist()
            class_names = metadata.get('target_classes') or [str(c) for c in np.unique(y_true_eval)]
            result['confusion_matrix'] = {
                'labels': class_names,
                'matrix': cm
            }

            # ROC curve (binary only)
            if len(np.unique(y_true_eval)) == 2 and y_scores.shape[1] >= 2:
                fpr, tpr, _ = roc_curve(y_true_eval, y_scores[:, 1])
                roc_auc = auc(fpr, tpr)
                result['roc_curve'] = {
                    'fpr': [round(float(v), 4) for v in fpr],
                    'tpr': [round(float(v), 4) for v in tpr],
                    'auc': round(float(roc_auc), 4)
                }

                # Precision-Recall curve
                precision, recall, _ = precision_recall_curve(y_true_eval, y_scores[:, 1])
                result['pr_curve'] = {
                    'precision': [round(float(p), 4) for p in precision],
                    'recall': [round(float(r), 4) for r in recall]
                }

            # Class distribution in evaluation
            unique, counts = np.unique(y_true_eval, return_counts=True)
            class_names_eval = metadata.get('target_classes') or [str(c) for c in unique]
            result['class_distribution'] = {
                'labels': [str(class_names_eval[i]) if i < len(class_names_eval) else str(unique[i]) for i in range(len(unique))],
                'counts': counts.tolist()
            }

        except Exception:
            pass

    # --- REGRESSION evaluation ---
    elif task == 'regression' and target_col:
        y_true = df[target_col].values[:len(X)]
        X_eval = X.iloc[:len(y_true)]
        try:
            y_pred = model.predict(X_eval)
            result['actual_vs_predicted'] = {
                'actual': [round(float(v), 4) for v in y_true[:500]],
                'predicted': [round(float(p), 4) for p in y_pred[:500]]
            }
            # Residuals
            residuals = y_true[:500] - y_pred[:500]
            result['residuals'] = [round(float(r), 4) for r in residuals]
        except Exception:
            pass

    # --- FEATURE IMPORTANCE ---
    try:
        if hasattr(model, 'feature_importances_'):
            importance = model.feature_importances_
            feat_imp = sorted(zip(features, importance), key=lambda x: x[1], reverse=True)
            result['feature_importance'] = {
                'features': [f[0] for f in feat_imp],
                'importance': [round(float(f[1]), 4) for f in feat_imp]
            }
        elif hasattr(model, 'coef_'):
            coef = model.coef_
            if coef.ndim > 1:
                coef = coef[0]
            coef_list = coef.tolist() if hasattr(coef, 'tolist') else list(coef)
            feat_imp = sorted(zip(features, [abs(c) for c in coef_list]), key=lambda x: x[1], reverse=True)
            result['feature_importance'] = {
                'features': [f[0] for f in feat_imp],
                'importance': [round(float(f[1]), 4) for f in feat_imp]
            }
    except Exception:
        pass

    # --- SHAP-style feature contribution (generalized) ---
    try:
        if hasattr(model, 'feature_importances_') or hasattr(model, 'coef_'):
            n_features = len(features)
            shap_summary = {
                'features': features,
                'mean_abs_shap': [0.0] * n_features,
                'min': [0.0] * n_features,
                'max': [0.0] * n_features
            }
            # Use a sample to compute per-feature impact via partial dependence
            sample_X = X.iloc[:min(100, len(X))]
            baseline = model.predict(sample_X).mean()
            for i, col in enumerate(features):
                perturbed = sample_X.copy()
                perturbed[col] = perturbed[col].max()
                impact = model.predict(perturbed) - baseline
                shap_summary['mean_abs_shap'][i] = round(float(np.abs(impact).mean()), 4)
                shap_summary['min'][i] = round(float(impact.min()), 4)
                shap_summary['max'][i] = round(float(impact.max()), 4)

            # Sort by mean abs shap
            paired = sorted(zip(shap_summary['features'], shap_summary['mean_abs_shap'], shap_summary['min'], shap_summary['max']), key=lambda x: x[1], reverse=True)
            shap_summary['features'] = [p[0] for p in paired]
            shap_summary['mean_abs_shap'] = [p[1] for p in paired]
            shap_summary['min'] = [p[2] for p in paired]
            shap_summary['max'] = [p[3] for p in paired]

            result['shap_summary'] = shap_summary
    except Exception:
        pass

    return jsonify(result)


@app.route('/api/report/generate', methods=['POST'])
def generate_report():
    """Generate a professional PDF report with model evaluation details."""
    try:
        data = request.get_json()
        if not data or 'model_id' not in data:
            return jsonify({'error': 'model_id is required'}), 400

        model_id = data['model_id']
        model, metadata = load_model_metadata(model_id)
        if model is None:
            return jsonify({'error': 'Model not found'}), 404

        from fpdf import FPDF

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=20)

        # --- Title ---
        pdf.set_font('Helvetica', 'B', 22)
        pdf.set_text_color(25, 35, 55)
        pdf.cell(0, 18, 'Machine Learning Model Report', new_x='LMARGIN', new_y='NEXT', align='C')
        pdf.ln(4)

        # --- Model Info ---
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 6, f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}', new_x='LMARGIN', new_y='NEXT', align='C')
        pdf.ln(8)

        pdf.set_draw_color(60, 80, 140)
        pdf.set_line_width(0.5)
        pdf.line(20, pdf.get_y(), 190, pdf.get_y())
        pdf.ln(6)

        # --- Section 1: Model Summary ---
        pdf.set_font('Helvetica', 'B', 14)
        pdf.set_text_color(25, 35, 55)
        pdf.cell(0, 10, '1. Model Summary', new_x='LMARGIN', new_y='NEXT')
        pdf.ln(2)

        info_items = [
            ('Model ID', model_id),
            ('Algorithm', metadata.get('algorithm', 'N/A')),
            ('Task', metadata.get('task', 'N/A')),
            ('Dataset', metadata.get('dataset_name', 'N/A')),
            ('Target Column', metadata.get('target_column', 'N/A')),
            ('Number of Features', str(len(metadata.get('features', [])))),
            ('Created', metadata.get('created_at', 'N/A')),
        ]
        pdf.set_font('Helvetica', '', 10)
        for label, value in info_items:
            pdf.set_text_color(60, 60, 60)
            pdf.cell(60, 7, label)
            pdf.set_text_color(25, 35, 55)
            pdf.cell(0, 7, value, new_x='LMARGIN', new_y='NEXT')

        pdf.ln(6)

        # --- Section 2: Dataset Summary ---
        dataset_id = metadata.get('dataset_id')
        if dataset_id:
            df, ds = read_dataset(dataset_id)
            if df is not None:
                pdf.set_font('Helvetica', 'B', 14)
                pdf.set_text_color(25, 35, 55)
                pdf.cell(0, 10, '2. Dataset Summary', new_x='LMARGIN', new_y='NEXT')
                pdf.ln(2)
                pdf.set_font('Helvetica', '', 10)
                ds_items = [
                    ('Dataset Name', ds.get('filename', 'N/A')),
                    ('Total Rows', str(len(df))),
                    ('Total Columns', str(len(df.columns))),
                    ('Numeric Columns', str(len(df.select_dtypes(include=[np.number]).columns))),
                    ('Categorical Columns', str(len(df.select_dtypes(include=['object', 'category']).columns))),
                ]
                for label, value in ds_items:
                    pdf.set_text_color(60, 60, 60)
                    pdf.cell(60, 7, label)
                    pdf.set_text_color(25, 35, 55)
                    pdf.cell(0, 7, value, new_x='LMARGIN', new_y='NEXT')
                pdf.ln(4)

        # --- Section 3: Performance Metrics ---
        metrics = metadata.get('metrics', {})
        if metrics:
            pdf.set_font('Helvetica', 'B', 14)
            pdf.set_text_color(25, 35, 55)
            pdf.cell(0, 10, '3. Performance Metrics', new_x='LMARGIN', new_y='NEXT')
            pdf.ln(2)
            pdf.set_font('Helvetica', '', 10)
            for key, value in metrics.items():
                if isinstance(value, (int, float)):
                    pdf.set_text_color(60, 60, 60)
                    label = key.replace('_', ' ').title()
                    pdf.cell(60, 7, label)
                    pdf.set_text_color(25, 35, 55)
                    val_str = f'{value:.4f}' if isinstance(value, float) else str(value)
                    pdf.cell(0, 7, val_str, new_x='LMARGIN', new_y='NEXT')
            pdf.ln(4)

        # --- Section 4: Feature Information ---
        features = metadata.get('features', [])
        if features:
            pdf.set_font('Helvetica', 'B', 14)
            pdf.set_text_color(25, 35, 55)
            pdf.cell(0, 10, '4. Features Used', new_x='LMARGIN', new_y='NEXT')
            pdf.ln(2)
            pdf.set_font('Helvetica', '', 9)
            pdf.set_text_color(25, 35, 55)
            for i, feat in enumerate(features, 1):
                pdf.cell(0, 5, f'  {i}. {feat}', new_x='LMARGIN', new_y='NEXT')

        # --- Section 5: Conclusion ---
        pdf.ln(8)
        pdf.set_draw_color(60, 80, 140)
        pdf.line(20, pdf.get_y(), 190, pdf.get_y())
        pdf.ln(6)
        pdf.set_font('Helvetica', 'B', 14)
        pdf.set_text_color(25, 35, 55)
        pdf.cell(0, 10, '5. Conclusion', new_x='LMARGIN', new_y='NEXT')
        pdf.ln(2)
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(60, 60, 60)

        label = metadata.get('label', '')
        if label:
            pdf.multi_cell(0, 6, f'The trained {metadata.get("algorithm", "model")} model achieved a performance of {label.lower()}.')
        else:
            pdf.multi_cell(0, 6, f'The {metadata.get("algorithm", "model")} model has been successfully trained and saved.')

        features_text = f'It uses {len(features)} feature(s) to make predictions based on the dataset "{metadata.get("dataset_name", "N/A")}".'
        pdf.multi_cell(0, 6, features_text)

        if metadata.get('task') == 'classification':
            pdf.multi_cell(0, 6, 'This is a classification model, suitable for predicting categorical outcomes.')
        elif metadata.get('task') == 'regression':
            pdf.multi_cell(0, 6, 'This is a regression model, suitable for predicting continuous numerical values.')

        # Save PDF
        report_dir = os.path.join(PREDICTIONS_DIR, 'reports')
        os.makedirs(report_dir, exist_ok=True)
        report_filename = f'report_{model_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        report_path = os.path.join(report_dir, report_filename)
        pdf.output(report_path)

        return jsonify({
            'message': 'Report generated successfully',
            'report_url': f'/api/report/download/{report_filename}'
        })

    except Exception as e:
        return jsonify({'error': f'Report generation failed: {str(e)}', 'traceback': traceback.format_exc()}), 500


@app.route('/api/report/download/<report_filename>', methods=['GET'])
def download_report(report_filename):
    """Download a generated PDF report."""
    report_dir = os.path.join(PREDICTIONS_DIR, 'reports')
    report_path = os.path.join(report_dir, report_filename)
    if not os.path.exists(report_path):
        return jsonify({'error': 'Report not found'}), 404
    return send_from_directory(report_dir, report_filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
