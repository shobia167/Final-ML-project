"""
Comprehensive algorithm metadata mapping for the ML workflow.
Each algorithm has its id, name, description, task type, model class import info,
and path to pre-trained .pkl file (if available).
"""
import os

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ALGORITHMS = {
    "supervised": {
        "display_name": "Supervised Learning",
        "description": "Learn from labeled training data to predict outcomes. Includes regression and classification algorithms for structured problems.",
        "icon": "S",
        "algorithms": [
            {
                "id": "adaboost-classifier",
                "name": "AdaBoost Classifier",
                "description": "Ensemble meta-estimator that fits classifiers on reweighted training samples, focusing on difficult cases.",
                "task": "classification",
                "icon": "AB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Ada Boost"),
                "model_file": "adaclass.pkl",
                "module": "sklearn.ensemble",
                "class_name": "AdaBoostClassifier",
                "params": {"n_estimators": 50, "learning_rate": 1.0}
            },
            {
                "id": "adaboost-regressor",
                "name": "AdaBoost Regressor",
                "description": "Ensemble meta-estimator for regression that fits regressors on reweighted training samples.",
                "task": "regression",
                "icon": "AB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Ada Boost"),
                "model_file": "adaregressor.pkl",
                "module": "sklearn.ensemble",
                "class_name": "AdaBoostRegressor",
                "params": {"n_estimators": 50, "learning_rate": 1.0}
            },
            {
                "id": "catboost-classifier",
                "name": "CatBoost Classifier",
                "description": "Gradient boosting with categorical feature support using ordered boosting and symmetric trees.",
                "task": "classification",
                "icon": "CB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "CatBoost"),
                "model_file": "catboostclass.pkl",
                "module": "catboost",
                "class_name": "CatBoostClassifier",
                "params": {"iterations": 100, "learning_rate": 0.1, "verbose": 0}
            },
            {
                "id": "catboost-regressor",
                "name": "CatBoost Regressor",
                "description": "Gradient boosting regressor with native categorical feature handling.",
                "task": "regression",
                "icon": "CB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "CatBoost"),
                "model_file": "catboostregressor.pkl",
                "module": "catboost",
                "class_name": "CatBoostRegressor",
                "params": {"iterations": 100, "learning_rate": 0.1, "verbose": 0}
            },
            {
                "id": "decision-tree-classifier",
                "name": "Decision Tree Classifier",
                "description": "Tree-based model that splits data on feature values for interpretable classification decisions.",
                "task": "classification",
                "icon": "DT",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Decision tree"),
                "model_file": "dt_classifier.pkl",
                "module": "sklearn.tree",
                "class_name": "DecisionTreeClassifier",
                "params": {"max_depth": None, "min_samples_split": 2}
            },
            {
                "id": "decision-tree-regressor",
                "name": "Decision Tree Regressor",
                "description": "Tree-based regression model that partitions data into regions for continuous value prediction.",
                "task": "regression",
                "icon": "DT",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Decision tree"),
                "model_file": "dt_regressor.pkl",
                "module": "sklearn.tree",
                "class_name": "DecisionTreeRegressor",
                "params": {"max_depth": None, "min_samples_split": 2}
            },
            {
                "id": "dnn-classifier",
                "name": "Deep Neural Network (MLP Classifier)",
                "description": "Multi-layer perceptron with 3 hidden layers for complex pattern recognition tasks.",
                "task": "classification",
                "icon": "DNN",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Deep neural network"),
                "model_file": "dnnclass.pkl",
                "module": "sklearn.neural_network",
                "class_name": "MLPClassifier",
                "params": {"hidden_layer_sizes": [100, 100, 100], "max_iter": 300}
            },
            {
                "id": "dnn-regressor",
                "name": "Deep Neural Network (MLP Regressor)",
                "description": "Multi-layer perceptron regressor for complex non-linear regression problems.",
                "task": "regression",
                "icon": "DNN",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Deep neural network"),
                "model_file": "dnnregressor.pkl",
                "module": "sklearn.neural_network",
                "class_name": "MLPRegressor",
                "params": {"hidden_layer_sizes": [100, 100, 100], "max_iter": 300}
            },
            {
                "id": "gradient-boosting-classifier",
                "name": "Gradient Boosting Classifier",
                "description": "Sequential ensemble method that builds trees correcting errors of previous trees.",
                "task": "classification",
                "icon": "GB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Gradient Boosting"),
                "model_file": "gbclass.pkl",
                "module": "sklearn.ensemble",
                "class_name": "GradientBoostingClassifier",
                "params": {"n_estimators": 100, "learning_rate": 0.1}
            },
            {
                "id": "gradient-boosting-regressor",
                "name": "Gradient Boosting Regressor",
                "description": "Sequential ensemble regressor that builds additive decision trees for accurate predictions.",
                "task": "regression",
                "icon": "GB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Gradient Boosting"),
                "model_file": "gbregressor.pkl",
                "module": "sklearn.ensemble",
                "class_name": "GradientBoostingRegressor",
                "params": {"n_estimators": 100, "learning_rate": 0.1}
            },
            {
                "id": "knn-classifier",
                "name": "K-Nearest Neighbors Classifier",
                "description": "Non-parametric method that classifies based on majority vote of k nearest neighbors.",
                "task": "classification",
                "icon": "KNN",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "KNN"),
                "model_file": "knnclass.pkl",
                "module": "sklearn.neighbors",
                "class_name": "KNeighborsClassifier",
                "params": {"n_neighbors": 5, "weights": "uniform"}
            },
            {
                "id": "knn-regressor",
                "name": "K-Nearest Neighbors Regressor",
                "description": "Non-parametric regression using local interpolation of k-nearest neighbor values.",
                "task": "regression",
                "icon": "KNN",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "KNN"),
                "model_file": "knnregressor.pkl",
                "module": "sklearn.neighbors",
                "class_name": "KNeighborsRegressor",
                "params": {"n_neighbors": 5, "weights": "uniform"}
            },
            {
                "id": "lightgbm-classifier",
                "name": "LightGBM Classifier",
                "description": "High-performance gradient boosting with leaf-wise tree growth for fast training on large data.",
                "task": "classification",
                "icon": "LGBM",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "LightGBM"),
                "model_file": "LGBMClass.pkl",
                "module": "lightgbm",
                "class_name": "LGBMClassifier",
                "params": {"n_estimators": 100, "learning_rate": 0.1, "verbose": -1}
            },
            {
                "id": "lightgbm-regressor",
                "name": "LightGBM Regressor",
                "description": "High-performance gradient boosting regressor with leaf-wise tree growth.",
                "task": "regression",
                "icon": "LGBM",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "LightGBM"),
                "model_file": "LGBMRegressor.pkl",
                "module": "lightgbm",
                "class_name": "LGBMRegressor",
                "params": {"n_estimators": 100, "learning_rate": 0.1, "verbose": -1}
            },
            {
                "id": "linear-regression",
                "name": "Simple Linear Regression",
                "description": "Models linear relationship between a single feature and continuous target variable.",
                "task": "regression",
                "icon": "LR",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Linear_regression", "Linear_regression"),
                "model_file": "ad.pkl",
                "module": "sklearn.linear_model",
                "class_name": "LinearRegression",
                "params": {}
            },
            {
                "id": "multiple-linear-regression",
                "name": "Multiple Linear Regression",
                "description": "Models linear relationship between multiple features and a continuous target variable.",
                "task": "regression",
                "icon": "MLR",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Linear_regression", "Multiple Linear Regression"),
                "model_file": "mad.pkl",
                "module": "sklearn.linear_model",
                "class_name": "LinearRegression",
                "params": {}
            },
            {
                "id": "polynomial-regression",
                "name": "Polynomial Regression",
                "description": "Models non-linear relationships by introducing polynomial feature transformations (degree 2).",
                "task": "regression",
                "icon": "PR",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Linear_regression", "polynomial regression"),
                "model_file": "salary_poly.pkl",
                "module": "sklearn.preprocessing",
                "class_name": "PolynomialFeatures",
                "params": {"degree": 2}
            },
            {
                "id": "ridge-regression",
                "name": "Ridge Regression (L2)",
                "description": "Linear regression with L2 regularization to prevent overfitting by penalizing large coefficients.",
                "task": "regression",
                "icon": "R",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Linear_regression", "L1,L2 regression"),
                "model_file": "ridge.pkl",
                "module": "sklearn.linear_model",
                "class_name": "Ridge",
                "params": {"alpha": 1.0}
            },
            {
                "id": "lasso-regression",
                "name": "Lasso Regression (L1)",
                "description": "Linear regression with L1 regularization that can shrink coefficients to zero for feature selection.",
                "task": "regression",
                "icon": "L",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Linear_regression", "L1,L2 regression"),
                "model_file": "lasso.pkl",
                "module": "sklearn.linear_model",
                "class_name": "Lasso",
                "params": {"alpha": 1.0}
            },
            {
                "id": "elastic-net-regression",
                "name": "Elastic Net Regression",
                "description": "Linear regression combining L1 and L2 penalties for balanced regularization.",
                "task": "regression",
                "icon": "EN",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Linear_regression", "Elastic net regression"),
                "model_file": "elastic.pkl",
                "module": "sklearn.linear_model",
                "class_name": "ElasticNet",
                "params": {"alpha": 1.0, "l1_ratio": 0.5}
            },
            {
                "id": "logistic-regression-binary",
                "name": "Binary Logistic Regression",
                "description": "Models probability of binary outcomes using the logistic function with a single feature.",
                "task": "classification",
                "icon": "LogR",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Logistic Regression"),
                "model_file": "binary_logistic.pkl",
                "module": "sklearn.linear_model",
                "class_name": "LogisticRegression",
                "params": {"solver": "lbfgs", "max_iter": 100}
            },
            {
                "id": "logistic-regression-multinomial",
                "name": "Multinomial Logistic Regression",
                "description": "Extends binary logistic regression to handle multiple classes using softmax function.",
                "task": "classification",
                "icon": "LogR",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Logistic Regression"),
                "model_file": "multinomial_logistic.pkl",
                "module": "sklearn.linear_model",
                "class_name": "LogisticRegression",
                "params": {"solver": "lbfgs", "max_iter": 100, "multi_class": "multinomial"}
            },
            {
                "id": "naive-bayes-classifier",
                "name": "Gaussian Naive Bayes",
                "description": "Probabilistic classifier based on Bayes' theorem assuming Gaussian feature distribution.",
                "task": "classification",
                "icon": "NB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Naive Bayes"),
                "model_file": "nbclass.pkl",
                "module": "sklearn.naive_bayes",
                "class_name": "GaussianNB",
                "params": {}
            },
            {
                "id": "neural-network-classifier",
                "name": "Neural Network (MLP Classifier)",
                "description": "Multi-layer perceptron with default parameters for pattern classification.",
                "task": "classification",
                "icon": "NN",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Neural_network"),
                "model_file": "nnclass.pkl",
                "module": "sklearn.neural_network",
                "class_name": "MLPClassifier",
                "params": {"max_iter": 200}
            },
            {
                "id": "random-forest-classifier",
                "name": "Random Forest Classifier",
                "description": "Ensemble of decision trees using bagging and random feature selection for robust classification.",
                "task": "classification",
                "icon": "RF",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Random Forest"),
                "model_file": "rt_classifier.pkl",
                "module": "sklearn.ensemble",
                "class_name": "RandomForestClassifier",
                "params": {"n_estimators": 100, "max_depth": None}
            },
            {
                "id": "random-forest-regressor",
                "name": "Random Forest Regressor",
                "description": "Ensemble of decision trees for regression, averaging predictions across many trees.",
                "task": "regression",
                "icon": "RF",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "Random Forest"),
                "model_file": "rt_regressor.pkl",
                "module": "sklearn.ensemble",
                "class_name": "RandomForestRegressor",
                "params": {"n_estimators": 100, "max_depth": None}
            },
            {
                "id": "svm-classifier",
                "name": "SVM Classifier (SVC)",
                "description": "Support Vector Machine that finds optimal hyperplane for class separation with maximum margin.",
                "task": "classification",
                "icon": "SVM",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "SVM"),
                "model_file": "svmclass.pkl",
                "module": "sklearn.svm",
                "class_name": "SVC",
                "params": {"kernel": "rbf", "probability": True}
            },
            {
                "id": "svm-regressor",
                "name": "SVM Regressor (SVR)",
                "description": "Support Vector Regression that finds a hyperplane fitting data within a margin of tolerance.",
                "task": "regression",
                "icon": "SVM",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "SVM"),
                "model_file": "svmregressor.pkl",
                "module": "sklearn.svm",
                "class_name": "SVR",
                "params": {"kernel": "rbf"}
            },
            {
                "id": "xgboost-classifier",
                "name": "XGBoost Classifier",
                "description": "Extreme Gradient Boosting with advanced regularization for state-of-the-art classification.",
                "task": "classification",
                "icon": "XGB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "XGBoost"),
                "model_file": "xgboostclass.pkl",
                "module": "xgboost",
                "class_name": "XGBClassifier",
                "params": {"n_estimators": 100, "learning_rate": 0.1, "use_label_encoder": False, "eval_metric": "logloss", "verbosity": 0}
            },
            {
                "id": "xgboost-regressor",
                "name": "XGBoost Regressor",
                "description": "Extreme Gradient Boosting regressor with advanced regularization for accurate predictions.",
                "task": "regression",
                "icon": "XGB",
                "folder": os.path.join(PROJECT_DIR, "Supervised Learning", "XGBoost"),
                "model_file": "xgboost.pkl",
                "module": "xgboost",
                "class_name": "XGBRegressor",
                "params": {"n_estimators": 100, "learning_rate": 0.1, "verbosity": 0}
            }
        ]
    },
    "unsupervised": {
        "display_name": "Unsupervised Learning",
        "description": "Discover hidden patterns in unlabeled data. Clustering, dimensionality reduction, and anomaly detection techniques.",
        "icon": "U",
        "algorithms": [
            {
                "id": "apriori",
                "name": "Apriori (Association Rules)",
                "description": "Mines frequent itemsets and generates association rules for market basket analysis.",
                "task": "association",
                "icon": "AP",
                "folder": os.path.join(PROJECT_DIR, "Unsupervised Learning", "Apriori"),
                "model_file": "apriori_rules.pkl",
                "module": "mlxtend.frequent_patterns",
                "class_name": "apriori",
                "params": {"min_support": 0.02}
            },
            {
                "id": "dbscan",
                "name": "DBSCAN Clustering",
                "description": "Density-based clustering algorithm that groups points with many nearby neighbors, identifying outliers.",
                "task": "clustering",
                "icon": "DB",
                "folder": os.path.join(PROJECT_DIR, "Unsupervised Learning", "DBSCAN"),
                "model_file": "db.pkl",
                "module": "sklearn.cluster",
                "class_name": "DBSCAN",
                "params": {"eps": 0.5, "min_samples": 5}
            },
            {
                "id": "hierarchical-clustering",
                "name": "Hierarchical (Agglomerative) Clustering",
                "description": "Builds nested clusters by recursively merging similar data points based on distance metrics.",
                "task": "clustering",
                "icon": "HC",
                "folder": os.path.join(PROJECT_DIR, "Unsupervised Learning", "Hierarchical clustering"),
                "model_file": "aggclus.pkl",
                "module": "sklearn.cluster",
                "class_name": "AgglomerativeClustering",
                "params": {"n_clusters": 3}
            },
            {
                "id": "isolation-forest",
                "name": "Isolation Forest",
                "description": "Anomaly detection algorithm that isolates outliers using random partitioning of data.",
                "task": "anomaly",
                "icon": "IF",
                "folder": os.path.join(PROJECT_DIR, "Unsupervised Learning", "Isolation forest"),
                "model_file": "iso.pkl",
                "module": "sklearn.ensemble",
                "class_name": "IsolationForest",
                "params": {"n_estimators": 100, "contamination": "auto"}
            },
            {
                "id": "kmeans",
                "name": "K-Means Clustering",
                "description": "Partitions data into k clusters by minimizing within-cluster variance using centroid-based assignment.",
                "task": "clustering",
                "icon": "KM",
                "folder": os.path.join(PROJECT_DIR, "Unsupervised Learning", "K-means"),
                "model_file": "kmeans.pkl",
                "module": "sklearn.cluster",
                "class_name": "KMeans",
                "params": {"n_clusters": 3, "random_state": 42}
            },
            {
                "id": "pca",
                "name": "Principal Component Analysis (PCA)",
                "description": "Linear dimensionality reduction that projects data to lower dimensions maximizing variance.",
                "task": "dim_reduction",
                "icon": "PCA",
                "folder": os.path.join(PROJECT_DIR, "Unsupervised Learning", "PCA"),
                "model_file": "pca.pkl",
                "module": "sklearn.decomposition",
                "class_name": "PCA",
                "params": {"n_components": 2}
            },
            {
                "id": "tsne",
                "name": "t-SNE",
                "description": "Non-linear dimensionality reduction for visualization, preserving local structure of high-dimensional data.",
                "task": "dim_reduction",
                "icon": "tSNE",
                "folder": os.path.join(PROJECT_DIR, "Unsupervised Learning", "T-SNE"),
                "model_file": "tsne.pkl",
                "module": "sklearn.manifold",
                "class_name": "TSNE",
                "params": {"n_components": 2}
            }
        ]
    },
    "semi_supervised": {
        "display_name": "Semi-Supervised Learning",
        "description": "Combine labeled and unlabeled data for improved learning. Ideal when labeled data is scarce but unlabeled data is abundant.",
        "icon": "SS",
        "algorithms": [
            {
                "id": "co-training",
                "name": "Co-Training",
                "description": "Uses two classifiers (RandomForest + SVM) on different feature views, iteratively labeling unlabeled data.",
                "task": "semi_supervised",
                "icon": "CT",
                "folder": os.path.join(PROJECT_DIR, "Semi-Supervised Learning", "co-training"),
                "model_file": "co_t.pkl",
                "module": "sklearn.ensemble",
                "class_name": "RandomForestClassifier",
                "params": {"n_estimators": 100}
            },
            {
                "id": "label-propagation",
                "name": "Label Propagation",
                "description": "Propagates labels through the dataset using similarity graph, learning from both labeled and unlabeled points.",
                "task": "semi_supervised",
                "icon": "LP",
                "folder": os.path.join(PROJECT_DIR, "Semi-Supervised Learning", "Label propagation"),
                "model_file": "labp.pkl",
                "module": "sklearn.semi_supervised",
                "class_name": "LabelPropagation",
                "params": {"kernel": "rbf"}
            },
            {
                "id": "label-spreading",
                "name": "Label Spreading",
                "description": "Similar to Label Propagation but normalizes edge weights for more robust label diffusion.",
                "task": "semi_supervised",
                "icon": "LS",
                "folder": os.path.join(PROJECT_DIR, "Semi-Supervised Learning", "Label spreading"),
                "model_file": "labs.pkl",
                "module": "sklearn.semi_supervised",
                "class_name": "LabelSpreading",
                "params": {"kernel": "rbf"}
            },
            {
                "id": "pseudo-labeling",
                "name": "Pseudo Labeling",
                "description": "Trains a classifier on labeled data, generates pseudo-labels for unlabeled data, and retrains iteratively.",
                "task": "semi_supervised",
                "icon": "PL",
                "folder": os.path.join(PROJECT_DIR, "Semi-Supervised Learning", "Pseudo Labeling"),
                "model_file": "pseudolab.pkl",
                "module": "sklearn.ensemble",
                "class_name": "RandomForestClassifier",
                "params": {"n_estimators": 100}
            },
            {
                "id": "self-training-rf",
                "name": "Self-Training (Random Forest)",
                "description": "Wraps a supervised classifier for self-training, iteratively adding high-confidence predictions as training data.",
                "task": "semi_supervised",
                "icon": "ST",
                "folder": os.path.join(PROJECT_DIR, "Semi-Supervised Learning", "Self training"),
                "model_file": "self_train.pkl",
                "module": "sklearn.semi_supervised",
                "class_name": "SelfTrainingClassifier",
                "params": {"threshold": 0.75, "max_iter": 10}
            },
            {
                "id": "semi-supervised-svm",
                "name": "Semi-Supervised SVM",
                "description": "Self-training with an SVM classifier for semi-supervised learning with probabilistic outputs.",
                "task": "semi_supervised",
                "icon": "SSVM",
                "folder": os.path.join(PROJECT_DIR, "Semi-Supervised Learning", "Semi-supervised"),
                "model_file": "semi_svm.pkl",
                "module": "sklearn.semi_supervised",
                "class_name": "SelfTrainingClassifier",
                "params": {"threshold": 0.75, "max_iter": 10}
            }
        ]
    },
    "reinforcement": {
        "display_name": "Reinforcement Learning",
        "description": "Train agents through reward-based interaction with environments. Master Markov decision processes and policy optimization.",
        "icon": "RL",
        "algorithms": [],
        "info_only": True,
        "info_message": "Reinforcement Learning algorithms are coming soon. This module will include Q-Learning, Deep Q-Networks (DQN), Policy Gradients, and Proximal Policy Optimization (PPO) for training intelligent agents through environment interaction."
    }
}


def get_learning_types():
    """Return the list of learning types with basic info."""
    types = []
    for key, value in ALGORITHMS.items():
        entry = {
            "id": key,
            "display_name": value["display_name"],
            "description": value["description"],
            "icon": value["icon"],
            "algorithm_count": len(value["algorithms"]),
            "info_only": value.get("info_only", False)
        }
        if value.get("info_only"):
            entry["info_message"] = value["info_message"]
        types.append(entry)
    return types


def get_algorithms_for_type(learning_type):
    """Return algorithms for a given learning type."""
    group = ALGORITHMS.get(learning_type)
    if not group:
        return None
    if group.get("info_only"):
        return {"info_only": True, "info_message": group["info_message"]}
    return {
        "display_name": group["display_name"],
        "description": group["description"],
        "algorithms": [
            {
                "id": algo["id"],
                "name": algo["name"],
                "description": algo["description"],
                "task": algo["task"],
                "icon": algo["icon"],
                "default_params": algo["params"]
            }
            for algo in group["algorithms"]
        ]
    }


def get_algorithm_by_id(algo_id):
    """Find algorithm metadata by its ID."""
    for group in ALGORITHMS.values():
        for algo in group["algorithms"]:
            if algo["id"] == algo_id:
                return algo
    return None


def get_algorithm_folder(algo_id):
    """Return the folder path containing the .pkl file for an algorithm."""
    algo = get_algorithm_by_id(algo_id)
    if algo:
        return algo["folder"]
    return None


def get_model_path(algo_id):
    """Return full path to the pre-trained .pkl file if it exists."""
    algo = get_algorithm_by_id(algo_id)
    if algo:
        pkl_path = os.path.join(algo["folder"], algo["model_file"])
        if os.path.exists(pkl_path):
            return pkl_path
    return None
