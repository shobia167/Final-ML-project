import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = "https://final-ml-project-sqly.onrender.com"
const taskBadgeColors = {
  classification: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50',
  regression: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
  clustering: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/50',
  dim_reduction: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/50',
  anomaly: 'bg-red-50 text-red-700 ring-1 ring-red-200/50',
  semi_supervised: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/50',
  association: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200/50',
}

export default function MyModels() {
  const navigate = useNavigate()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/models`)
      const data = await res.json()
      if (res.ok) {
        setModels(data.models || [])
      } else {
        setError(data.error || 'Failed to load models')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const handleDelete = async (modelId) => {
    if (!window.confirm(`Delete model "${modelId}"? This action cannot be undone.`)) return
    try {
      const res = await fetch(`${API}/api/models/${modelId}`, { method: 'DELETE' })
      if (res.ok) {
        setModels((prev) => prev.filter((m) => m.model_id !== modelId))
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete model')
      }
    } catch {
      setError('Failed to delete model')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-border p-10 md:p-16 text-center animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-5 shadow-sm">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-navy font-[family-name:Plus_Jakarta_Sans]">No Saved Models</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Train and save a model to see it listed here. You can download, compare, and manage your models.
          </p>
          <button
            onClick={() => navigate('/machine-learning')}
            className="mt-6 px-6 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-all duration-200 shadow-sm"
          >
            Go to Training
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-5 rounded-full bg-accent" />
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider">Saved Models</h2>
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-gray-400">{models.length} model{models.length !== 1 ? 's' : ''}</span>
        <button onClick={fetchModels} className="text-xs text-gray-400 hover:text-navy transition-colors p-1" title="Refresh">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {models.map((m, i) => (
          <div
            key={m.model_id}
            className="bg-white rounded-2xl border border-border p-5 card-hover animate-fade-in-up flex flex-col"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                  {m.algorithm?.charAt(0) || 'M'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-navy font-[family-name:Plus_Jakarta_Sans] truncate">{m.algorithm}</h3>
                  <p className="text-[10px] text-gray-400 truncate">ID: {m.model_id}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${taskBadgeColors[m.task] || 'bg-gray-50 text-gray-600'}`}>
                {m.task?.replace('_', ' ')}
              </span>
            </div>

            {/* Metric Badge */}
            <div className={`rounded-xl px-4 py-2.5 mb-4 text-sm font-bold font-[family-name:Plus_Jakarta_Sans] ${
              m.metrics?.accuracy
                ? m.metrics.accuracy >= 0.8 ? 'bg-green-50 text-green-700' : m.metrics.accuracy >= 0.6 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                : m.metrics?.r2_score
                  ? m.metrics.r2_score >= 0.7 ? 'bg-green-50 text-green-700' : m.metrics.r2_score >= 0.4 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                  : 'bg-gray-50 text-gray-500'
            }`}>
              {m.label || `${m.task} model`}
            </div>

            {/* Info rows */}
            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Dataset</span>
                <span className="text-navy font-semibold truncate ml-2 text-right max-w-[180px]">{m.dataset_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Features</span>
                <span className="text-navy font-semibold">{(m.features || []).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Created</span>
                <span className="text-navy font-semibold text-[10px]">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
              <button
                onClick={() => navigate(`/results?model_id=${m.model_id}&tab=visualize`)}
                className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                Visualize
              </button>
              <button
                onClick={() => navigate(`/results?model_id=${m.model_id}`)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                Predict
              </button>
              {m.model_path && (
                <a
                  href={`${API}${m.model_path}`}
                  download
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  .pkl
                </a>
              )}
              <button
                onClick={() => handleDelete(m.model_id)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
