import { useState, useEffect, useRef } from 'react'
import { useNotifications } from '../context/NotificationContext'

export default function UploadDataset() {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [columns, setColumns] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    try {
      const res = await fetch('http://localhost:5000/datasets')
      const data = await res.json()
      setDatasets(data.datasets ?? [])
    } catch (err) {
      console.error('Failed to fetch datasets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDatasetSelect = async (e) => {
    const ds = e.target.value
    setSelectedDataset(ds)
    setMetrics(null)
    setColumns([])

    if (!ds) return

    setLoadingMetrics(true)
    try {
      const res = await fetch(`http://localhost:5000/dataset/${ds}/metrics`)
      const data = await res.json()
      setColumns(data.columns ?? [])
      setMetrics(data.metrics ?? {})
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    } finally {
      setLoadingMetrics(false)
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:5000/upload', { method: 'POST', body: formData })
      const data = await res.json()
      addNotification({ type: 'success', title: 'Upload Complete', message: `Uploaded dataset: ${data.filename ?? file.name}`, category: 'upload' })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchDatasets()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-heading"><h2>Upload Dataset</h2><div className="divider" /></div>

      {/* Upload Zone */}
      <div className="card-base p-7 card-hover">
        <h3 className="text-sm font-bold text-navy mb-4">Upload New Dataset</h3>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-accent bg-blue-50/50 shadow-inner'
              : 'border-border hover:border-accent/40 hover:bg-surface/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center transition-all mb-4 ${
            dragOver ? 'bg-accent/10' : 'bg-surface'
          }`}>
            <svg className={`w-7 h-7 transition-colors ${dragOver ? 'text-accent' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">
            {file ? (
              <span className="text-accent font-semibold">{file.name}</span>
            ) : (
              <>
                Drop your CSV file here, or <span className="text-accent font-semibold underline underline-offset-2 decoration-2 decoration-accent/30 hover:decoration-accent/60">browse</span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">Supports .csv files</p>
          {file && (
            <button
              onClick={(e) => { e.stopPropagation(); handleUpload() }}
              disabled={uploading}
              className="btn-primary mt-5"
            >
              {uploading ? 'Uploading...' : 'Upload Dataset'}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Existing Datasets */}
      <div className="card-base">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-navy">Existing Datasets</h3>
            <p className="text-xs text-gray-400 mt-0.5">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''} available</p>
          </div>
          <select
            value={selectedDataset}
            onChange={handleDatasetSelect}
            className="select-base sm:w-64"
          >
            <option value="">Select a dataset...</option>
            {datasets.map((ds) => (
              <option key={ds} value={ds}>{ds}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 animate-shimmer">Loading datasets...</div>
        ) : datasets.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="text-sm text-gray-400">No datasets uploaded yet.</p>
          </div>
        ) : !selectedDataset ? (
          <div className="p-8 text-center">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <p className="text-sm text-gray-400">Select a dataset to view its details and metrics.</p>
          </div>
        ) : loadingMetrics ? (
          <div className="p-8 text-sm text-gray-400 animate-shimmer">Loading dataset metrics...</div>
        ) : (
          <div className="divide-y divide-border">
            {/* Columns */}
            {columns.length > 0 && (
              <div className="p-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Columns ({columns.length})</h4>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="table-header">
                        <th>Column</th>
                        <th>Data Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, i) => (
                        <tr key={i} className="hover:bg-surface/50 transition-colors">
                          <td className="table-cell font-medium text-gray-800">{col.name}</td>
                          <td className="table-cell">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              col.type === 'numerical' || col.type === 'int64' || col.type === 'float64'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {col.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Metrics */}
            {metrics && (
              <div className="p-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dataset Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Rows', value: metrics.rows, icon: RowsIcon, color: 'from-blue-500 to-blue-600' },
                    { label: 'Columns', value: metrics.columns, icon: ColsIcon, color: 'from-violet-500 to-violet-600' },
                    { label: 'Missing Values', value: metrics.missing_values ?? 0, icon: MissingIcon, color: metrics.missing_values > 0 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600' },
                    { label: 'Duplicated Rows', value: metrics.duplicated_rows ?? 0, icon: DupIcon, color: metrics.duplicated_rows > 0 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600' },
                    { label: 'Memory Usage', value: metrics.memory_usage ?? '—', icon: MemIcon, color: 'from-teal-500 to-teal-600' },
                  ].map((m, i) => (
                    <div key={m.label} className="card-base p-3.5 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                        <m.icon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-400 font-medium truncate">{m.label}</p>
                        <p className="text-sm font-bold text-navy">{m.value ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RowsIcon() { return <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg> }
function ColsIcon() { return <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg> }
function MissingIcon() { return <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg> }
function DupIcon() { return <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg> }
function MemIcon() { return <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12M6 12h12M6 18h12" /></svg> }
