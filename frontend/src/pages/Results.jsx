import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import VisualizationDashboard from '../components/VisualizationDashboard'
import { useNotifications } from '../context/NotificationContext'

const API = 'http://localhost:5000'

export default function Results() {
  const { addNotification } = useNotifications()
  const [searchParams] = useSearchParams()
  const urlModelId = searchParams.get('model_id')
  const urlTab = searchParams.get('tab')

  const [models, setModels] = useState([])
  const [predictions, setPredictions] = useState([])
  const [selectedModelId, setSelectedModelId] = useState(urlModelId || '')
  const [file, setFile] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [predictionResult, setPredictionResult] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState(urlTab || (urlModelId ? 'predict' : 'predict'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/models`).then(r => r.json()),
      fetch(`${API}/api/predictions`).then(r => r.json()),
    ]).then(([modelsData, predsData]) => {
      setModels(modelsData.models || [])
      setPredictions(predsData.predictions || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (urlModelId) {
      setSelectedModelId(urlModelId)
      setTab('predict')
    }
  }, [urlModelId])

  const handlePredict = async () => {
    if (!selectedModelId || !file) return
    setPredicting(true)
    setError(null)
    setPredictionResult(null)
    try {
      const formData = new FormData()
      formData.append('model_id', selectedModelId)
      formData.append('file', file)
      const res = await fetch(`${API}/api/predict`, { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setPredictionResult(data)
        addNotification({ type: 'success', title: 'Prediction Complete', message: `${data.total_predictions} predictions generated`, category: 'prediction' })
        const predsRes = await fetch(`${API}/api/predictions`).then(r => r.json())
        setPredictions(predsRes.predictions || [])
      } else {
        setError(data.error || 'Prediction failed')
        addNotification({ type: 'error', title: 'Prediction Failed', message: data.error || 'Prediction failed', category: 'prediction' })
      }
    } catch {
      setError('Failed to connect to prediction server')
      addNotification({ type: 'error', title: 'Prediction Failed', message: 'Failed to connect to prediction server', category: 'prediction' })
    } finally {
      setPredicting(false)
    }
  }

  const selectedModel = models.find(m => m.model_id === selectedModelId)

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        <button
          onClick={() => setTab('predict')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
            tab === 'predict' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
          }`}
        >
          Predict
        </button>
        <button
          onClick={() => setTab('visualize')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
            tab === 'visualize' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
          }`}
        >
          Visualizations
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
            tab === 'history' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setTab('models')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
            tab === 'models' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
          }`}
        >
          Models
        </button>
      </div>

      {tab === 'predict' && (
        <div className="space-y-6">
          {/* Model Selector */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Select Trained Model
            </h3>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="appearance-none w-full px-4 py-2.5 pr-10 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
            >
              <option value="">-- Select a model --</option>
              {models.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.algorithm} ({m.model_id}) - {m.label || m.task}
                </option>
              ))}
            </select>
            {models.length === 0 && (
              <p className="mt-3 text-xs text-gray-400">No trained models found. Train a model first from the ML page.</p>
            )}
          </div>

          {/* Selected Model Info */}
          {selectedModel && (
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Algorithm</p>
                  <p className="font-semibold text-navy mt-1">{selectedModel.algorithm}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Task</p>
                  <p className="font-semibold text-navy mt-1 capitalize">{selectedModel.task}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Features</p>
                  <p className="font-semibold text-navy mt-1 text-xs">{(selectedModel.features || []).length} columns</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Created</p>
                  <p className="font-semibold text-navy mt-1 text-xs">{selectedModel.created_at ? new Date(selectedModel.created_at).toLocaleString() : '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* File Upload */}
          {selectedModel && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Upload Data for Prediction
              </h3>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/40 transition-colors bg-gray-50/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-gray-400"><span className="font-semibold text-accent">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-300 mt-1">CSV or Excel file</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
              {file && (
                <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    {file.name}
                  </div>
                  <button onClick={() => setFile(null)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                </div>
              )}
              <button
                onClick={handlePredict}
                disabled={predicting || !file}
                className={`mt-4 w-full py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  predicting || !file
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-accent to-accent-lighter text-white hover:shadow-lg hover:shadow-blue-900/20'
                }`}
              >
                {predicting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                    </svg>
                    Run Prediction
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Prediction Results */}
          {predictionResult && (
            <div className="space-y-6 animate-scale-in">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Prediction Complete</p>
                    <p className="text-sm text-green-600">{predictionResult.total_predictions} predictions generated</p>
                  </div>
                </div>
                <a
                  href={`${API}${predictionResult.download_url}`}
                  download
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white text-green-700 transition-colors border border-green-200/50 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download CSV
                </a>
              </div>

              {/* Prediction Preview Table */}
              {predictionResult.preview && predictionResult.preview.length > 0 && (
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <h3 className="text-sm font-bold text-navy">Prediction Results Preview</h3>
                    <span className="text-xs text-gray-400">({predictionResult.total_predictions} rows)</span>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {predictionResult.columns.map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-[11px] text-gray-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {predictionResult.preview.map((row, i) => (
                          <tr key={i} className="border-t border-border hover:bg-gray-50/50">
                            {predictionResult.columns.map((col) => (
                              <td key={col} className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                                {String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Visualizations Tab */}
      {tab === 'visualize' && (
        <div className="space-y-6">
          {selectedModelId ? (
            <VisualizationDashboard
              modelId={selectedModelId}
              datasetId={models.find(m => m.model_id === selectedModelId)?.dataset_id || null}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-border p-10 text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <h3 className="text-sm font-bold text-navy">Select a Model</h3>
              <p className="mt-1 text-sm text-gray-400">Choose a model from the Predict tab to see visualizations.</p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <h3 className="text-sm font-bold text-navy">Prediction History</h3>
          </div>
          {predictions.length === 0 ? (
            <div className="p-10 text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <p className="text-sm text-gray-400">No prediction history yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Model</th>
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-semibold uppercase tracking-wider">File</th>
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Predictions</th>
                    <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p) => (
                    <tr key={p.prediction_id} className="border-t border-border hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{p.algorithm}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{p.filename}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{p.num_predictions}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`${API}/api/predictions/${p.prediction_id}/download`}
                          download
                          className="text-xs font-semibold text-accent hover:text-accent-lighter transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          CSV
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Models Tab */}
      {tab === 'models' && (
        <div className="space-y-4">
          {models.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-10 text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              <p className="text-sm text-gray-400">No trained models available.</p>
            </div>
          ) : (
            models.map((m) => (
              <div key={m.model_id} className="bg-white rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-navy">{m.algorithm}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Model ID: {m.model_id}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 capitalize">{m.task}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{(m.features || []).length} features</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{m.label || '—'}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedModelId(m.model_id); setTab('predict') }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    Use for Prediction
                  </button>
                  {m.model_path && (
                    <a
                      href={`${API}${m.model_path}`}
                      download
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
