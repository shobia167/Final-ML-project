import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = "https://final-ml-project-sqly.onrender.com"

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins + 'm ago'
  if (hrs < 24) return hrs + 'h ago'
  if (days < 7) return days + 'd ago'
  return d.toLocaleDateString()
}

function TaskBadge({ task }) {
  const colors = {
    classification: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
    regression: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
    clustering: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
    dim_reduction: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
    anomaly: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
    association: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/60',
    semi_supervised: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60',
  }
  const labels = {
    classification: 'Classification',
    regression: 'Regression',
    clustering: 'Clustering',
    dim_reduction: 'Dim. Reduction',
    anomaly: 'Anomaly Detection',
    association: 'Association',
    semi_supervised: 'Semi-Supervised',
  }
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${colors[task] || 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/60'}`}>
      {labels[task] || task}
    </span>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/api/datasets`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/api/models`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/api/predictions`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/api/algorithms`).then(r => r.ok ? r.json() : Promise.reject()),
    ]).then(([datasetsRes, modelsRes, predictionsRes, algorithmsRes]) => {
      const datasets = datasetsRes.status === 'fulfilled' ? datasetsRes.value : []
      const modelsData = modelsRes.status === 'fulfilled' ? modelsRes.value : { models: [] }
      const predictions = predictionsRes.status === 'fulfilled' ? predictionsRes.value : { predictions: [] }
      const algorithms = algorithmsRes.status === 'fulfilled' ? algorithmsRes.value : []
      setData({
        datasets: Array.isArray(datasets) ? datasets : [],
        models: modelsData.models || [],
        predictions: predictions.predictions || [],
        algorithms: Array.isArray(algorithms) ? algorithms : [],
      })
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-7 rounded-full bg-accent" />
          <h2 className="text-lg font-extrabold text-navy tracking-tight">Dashboard</h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-7 animate-shimmer border border-border/60 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 mb-4" />
              <div className="h-4 w-24 bg-gray-100 rounded-md mb-2" />
              <div className="h-8 w-16 bg-gray-100 rounded-md" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-2xl p-7 animate-shimmer border border-border/60 shadow-sm">
            <div className="h-5 w-40 bg-gray-100 rounded-md mb-5" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-7 animate-shimmer border border-border/60 shadow-sm">
            <div className="h-5 w-40 bg-gray-100 rounded-md mb-5" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-7 animate-shimmer border border-border/60 shadow-sm">
          <div className="h-5 w-32 bg-gray-100 rounded-md mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-7 rounded-full bg-accent" />
          <h2 className="text-lg font-extrabold text-navy tracking-tight">Dashboard</h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="bg-white rounded-2xl p-10 border border-border/60 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-600">Could not load dashboard data.</p>
          <p className="text-sm text-gray-400 mt-2">Please make sure the Flask server is running on port 5000.</p>
        </div>
      </div>
    )
  }

  const { datasets, models, predictions, algorithms } = data
  const totalAlgorithms = algorithms.reduce((sum, a) => sum + (a.algorithm_count || 0), 0)

  const taskCounts = {}
  models.forEach(m => {
    const task = m.task || 'unknown'
    taskCounts[task] = (taskCounts[task] || 0) + 1
  })

  const recentDatasets = datasets.slice(0, 5)
  const recentModels = models.slice(0, 5)

  const activity = [
    ...datasets.map(d => ({
      type: 'upload',
      message: `Uploaded dataset "${d.filename}"`,
      time: formatDate(d.uploaded_at),
      date: d.uploaded_at,
    })),
    ...models.map(m => ({
      type: 'training',
      message: `Trained ${m.algorithm} on "${m.dataset_name || m.dataset_id}"`,
      time: formatDate(m.created_at),
      date: m.created_at,
    })),
    ...predictions.map(p => ({
      type: 'predict',
      message: `Predicted ${p.num_predictions} results with ${p.algorithm}`,
      time: formatDate(p.created_at),
      date: p.created_at,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)

  const quickActions = [
    { label: 'Upload Dataset', desc: 'Import CSV or Excel files', to: '/upload', icon: UploadIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Machine Learning', desc: 'Train models with algorithms', to: '/machine-learning', icon: MLIcon, color: 'from-violet-500 to-violet-600' },
    { label: 'Results', desc: 'View predictions and charts', to: '/results', icon: ResultsIcon, color: 'from-emerald-500 to-emerald-600' },
    { label: 'My Models', desc: 'Manage saved models', to: '/my-models', icon: ModelsIcon, color: 'from-amber-500 to-amber-600' },
  ]

  const statCards = [
    { label: 'Total Datasets', value: datasets.length, icon: DatasetIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Trained Models', value: models.length, icon: ModelIcon, color: 'from-violet-500 to-violet-600' },
    { label: 'Total Predictions', value: predictions.length, icon: PredictIcon, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Algorithms', value: totalAlgorithms, icon: AlgorithmIcon, color: 'from-amber-500 to-amber-600' },
  ]

  const learningTypes = algorithms

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10 animate-fade-in">

      {/* ── Welcome Section ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-7 rounded-full bg-accent" />
        <h2 className="text-lg font-extrabold text-navy tracking-tight">Dashboard</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="bg-white rounded-2xl p-8 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-extrabold text-navy tracking-tight">Welcome to Machine Learning Platform</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">Upload datasets, train models, and make predictions — all in one place.</p>
          </div>
          <Link to="/upload" className="btn-primary inline-flex items-center gap-2.5 shrink-0 px-6 py-2.5 text-sm font-semibold rounded-xl shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/25 transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Get Started
          </Link>
        </div>
      </div>

      {/* ── Quick Action Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, i) => (
          <Link
            key={action.label}
            to={action.to}
            className={`bg-white rounded-2xl p-6 border border-border/60 shadow-sm stagger-${i + 1} animate-fade-in-up group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center`}
          >
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg shadow-${action.color.split(' ')[0].replace('from-', '')}/20 mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <action.icon />
            </div>
            <p className="text-base font-bold text-navy group-hover:text-accent transition-colors duration-200">{action.label}</p>
            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={card.label} className={`bg-white rounded-2xl p-7 border border-border/60 shadow-sm stagger-${i + 1} animate-fade-in-up hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center`}>
            <div className="flex items-center justify-center gap-5 mb-5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                <card.icon />
              </div>
              <span className="text-3xl font-extrabold text-navy">{card.value}</span>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Dataset & Model Statistics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-7 border border-border/60 shadow-sm animate-fade-in-up stagger-5 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            <h3 className="text-base font-extrabold text-navy tracking-tight">Dataset Statistics</h3>
          </div>
          {datasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">No datasets uploaded yet.</p>
              <p className="text-xs text-gray-300 mt-1">Upload a CSV or Excel file to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-5 text-center border border-blue-100/50">
                <p className="text-3xl font-extrabold text-blue-600">{datasets.length}</p>
                <p className="text-xs font-semibold text-blue-500/70 uppercase tracking-wider mt-1">Total Datasets</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl p-5 text-center border border-emerald-100/50">
                <p className="text-3xl font-extrabold text-emerald-600">{predictions.length}</p>
                <p className="text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mt-1">Total Predictions</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-7 border border-border/60 shadow-sm animate-fade-in-up stagger-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1 h-5 rounded-full bg-violet-500" />
            <h3 className="text-base font-extrabold text-navy tracking-tight">Trained Model Statistics</h3>
          </div>
          {models.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">No models trained yet.</p>
              <p className="text-xs text-gray-300 mt-1">Train a model to see statistics here.</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-violet-50 to-violet-50/50 rounded-xl p-5 text-center border border-violet-100/50 mb-6">
                <p className="text-3xl font-extrabold text-violet-600">{models.length}</p>
                <p className="text-xs font-semibold text-violet-500/70 uppercase tracking-wider mt-1">Total Models</p>
              </div>
              {Object.keys(taskCounts).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(taskCounts).map(([task, count]) => (
                    <div key={task} className="flex items-center justify-between py-2 px-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <TaskBadge task={task} />
                      <span className="text-sm font-bold text-navy tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Recent Datasets & Recent Models ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-7 border border-border/60 shadow-sm animate-fade-in-up hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <h3 className="text-base font-extrabold text-navy tracking-tight">Recent Datasets</h3>
            </div>
            <Link to="/upload" className="text-xs font-semibold text-accent hover:text-accent-light transition-colors px-3 py-1.5 rounded-lg hover:bg-accent/5">View All</Link>
          </div>
          {recentDatasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">No datasets uploaded yet.</p>
              <p className="text-xs text-gray-300 mt-1">Upload a CSV or Excel file to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60 -mx-1">
              {recentDatasets.map((d) => (
                <div key={d.dataset_id} className="flex items-center gap-4 py-4 px-1 first:pt-0 last:pb-0 hover:bg-gray-50/50 rounded-xl -mx-1.5 px-1.5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{d.filename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(d.file_size)}</p>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2.5 py-1 rounded-full">{formatDate(d.uploaded_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-7 border border-border/60 shadow-sm animate-fade-in-up hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-violet-500" />
              <h3 className="text-base font-extrabold text-navy tracking-tight">Recent Models</h3>
            </div>
            <Link to="/my-models" className="text-xs font-semibold text-accent hover:text-accent-light transition-colors px-3 py-1.5 rounded-lg hover:bg-accent/5">View All</Link>
          </div>
          {recentModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">No models trained yet.</p>
              <p className="text-xs text-gray-300 mt-1">Train a model to see your models here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60 -mx-1">
              {recentModels.map((m) => (
                <div key={m.model_id} className="flex items-center gap-4 py-4 px-1 first:pt-0 last:pb-0 hover:bg-gray-50/50 rounded-xl -mx-1.5 px-1.5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{m.algorithm}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <TaskBadge task={m.task} />
                      {m.label && (
                        <span className="text-xs font-medium text-gray-400">{m.label}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2.5 py-1 rounded-full">{formatDate(m.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ML Categories ── */}
      <div className="bg-white rounded-2xl p-7 border border-border/60 shadow-sm animate-fade-in-up hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-1 h-5 rounded-full bg-amber-500" />
          <h3 className="text-base font-extrabold text-navy tracking-tight">Machine Learning Categories</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {learningTypes.map((lt, i) => (
            <div key={lt.id} className={`bg-gradient-to-br from-gray-50 to-white rounded-2xl p-7 border border-border/60 stagger-${i + 1} animate-fade-in-up hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 h-full flex flex-col items-center text-center`}>
              <div className="flex items-center justify-center gap-3.5 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-lg ${
                  lt.id === 'supervised' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20' :
                  lt.id === 'unsupervised' ? 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/20' :
                  lt.id === 'semi_supervised' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20' :
                  'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20'
                }`}>
                  {lt.icon}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-navy">{lt.display_name}</p>
                  <p className="text-xs font-medium text-gray-400 mt-0.5">{lt.algorithm_count} {lt.algorithm_count === 1 ? 'algorithm' : 'algorithms'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {lt.info_only ? lt.info_message : lt.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="bg-white rounded-2xl p-7 border border-border/60 shadow-sm animate-fade-in-up hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-1 h-5 rounded-full bg-gray-400" />
          <h3 className="text-base font-extrabold text-navy tracking-tight">Recent Activity</h3>
        </div>
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">No activity yet.</p>
            <p className="text-xs text-gray-300 mt-1">Upload a dataset to get started!</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100 rounded-full" />
            <div className="space-y-2">
              {activity.map((act, i) => (
                <div key={i} className="flex items-start gap-5 py-3.5 relative">
                  <div className={`relative z-10 mt-1 w-[38px] shrink-0 flex justify-center`}>
                    <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      act.type === 'upload' ? 'bg-blue-500' :
                      act.type === 'training' ? 'bg-violet-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0 bg-gray-50/50 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors">
                    <p className="text-sm text-gray-600 leading-snug">
                      <span className="font-semibold text-gray-800">{act.message}</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap mt-3.5 mr-1">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

/* ── Icon Components ── */

function UploadIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  )
}

function MLIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
    </svg>
  )
}

function ResultsIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function ModelsIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  )
}

function DatasetIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

function ModelIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  )
}

function PredictIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function AlgorithmIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
    </svg>
  )
}
