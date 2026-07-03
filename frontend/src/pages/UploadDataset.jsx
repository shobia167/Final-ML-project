import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useNotifications } from '../context/NotificationContext'

const API = 'http://localhost:5000'

function detectType(v) {
  if (v === null || v === undefined || v === '') return 'object'
  if (typeof v === 'boolean') return 'bool'
  if (typeof v === 'number') return Number.isInteger(v) ? 'int64' : 'float64'
  if (typeof v === 'string') {
    if (!isNaN(v) && v.trim() !== '') {
      const n = Number(v)
      return Number.isInteger(n) ? 'int64' : 'float64'
    }
    const d = new Date(v)
    if (!isNaN(d.getTime()) && v.includes('-')) return 'datetime64[ns]'
    return 'object'
  }
  return typeof v
}

export default function UploadDataset() {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [columns, setColumns] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [edaData, setEdaData] = useState(null)
  const [loadingEda, setLoadingEda] = useState(false)
  const [selectedHistCol, setSelectedHistCol] = useState('')
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    try {
      const res = await fetch(`${API}/api/datasets`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.datasets ?? [])
      setDatasets(list)
      if (!list.length) setLoading(false)
    } catch (err) {
      console.error('Failed to fetch datasets:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEda = async (ds) => {
    setLoadingEda(true)
    try {
      const res = await fetch(`${API}/api/dataset/${ds}/eda`)
      if (res.ok) {
        const data = await res.json()
        setEdaData(data)
        if (data?.numeric_columns?.length) setSelectedHistCol(data.numeric_columns[0])
      }
    } catch (err) {
      console.error('Failed to fetch EDA data:', err)
    } finally {
      setLoadingEda(false)
    }
  }

  const handleDatasetSelect = async (e) => {
    const ds = e.target.value
    setSelectedDataset(ds)
    setMetrics(null)
    setColumns([])
    setPreviewRows([])
    setEdaData(null)

    if (!ds) return

    setLoadingMetrics(true)
    try {
      const [previewRes, summaryRes] = await Promise.all([
        fetch(`${API}/api/dataset/${ds}/preview`).then(r => r.ok ? r.json() : Promise.reject()),
        fetch(`${API}/api/dataset/${ds}/summary`).then(r => r.ok ? r.json() : Promise.reject()),
      ])

      const colNames = previewRes.columns ?? []
      const rows = previewRes.rows ?? []
      setPreviewRows(rows)

      const sampleRow = rows[0] ?? {}
      const cols = colNames.map(name => ({
        name,
        type: detectType(sampleRow[name]),
      }))
      setColumns(cols)

      setMetrics({
        rows: summaryRes.rows,
        columns: summaryRes.columns,
        file_size: summaryRes.file_size,
        missing_values: summaryRes.missing_values,
        duplicated_rows: summaryRes.duplicate_rows ?? summaryRes.duplicated_rows ?? 0,
        memory_usage: summaryRes.memory_usage,
        numeric_columns: summaryRes.numeric_columns,
        categorical_columns: summaryRes.categorical_columns,
        total_rows: summaryRes.rows,
        total_columns: summaryRes.columns,
      })

      fetchEda(ds)
    } catch (err) {
      console.error('Failed to fetch dataset details:', err)
    } finally {
      setLoadingMetrics(false)
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API}/api/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      addNotification({ type: 'success', title: 'Upload Complete', message: `Uploaded dataset: ${data.filename ?? file.name}`, category: 'upload' })
      setUploadResult(data)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchDatasets()
      if (selectedDataset) fetchEda(selectedDataset)
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
    if (f) {
      setFile(f)
      setUploadResult(null)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">

      <div className="flex items-center gap-3">
        <div className="w-1 h-7 rounded-full bg-accent" />
        <h2 className="text-lg font-extrabold text-navy tracking-tight">Upload Dataset</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl p-6 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-5 rounded-full bg-accent" />
          <h3 className="text-base font-extrabold text-navy tracking-tight">Upload New Dataset</h3>
        </div>

        {uploadResult ? (
          /* --- Success Card --- */
          <div className="rounded-2xl p-8 text-center bg-gradient-to-br from-emerald-50/80 to-white border-2 border-emerald-200/60">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-200/50">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h4 className="text-lg font-extrabold text-emerald-800 mb-1">Dataset uploaded successfully</h4>
            <p className="text-sm text-emerald-600 mb-6">Your dataset has been uploaded and is ready for analysis.</p>
            <div className="inline-flex items-center gap-6 px-6 py-3 rounded-xl bg-white/80 border border-emerald-100/60 mb-6">
              <div className="text-center">
                <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">File</p>
                <p className="text-sm font-bold text-emerald-800 mt-0.5">{uploadResult.filename ?? '—'}</p>
              </div>
              {uploadResult.rows != null && (
                <>
                  <div className="w-px h-8 bg-emerald-200/60" />
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Rows</p>
                    <p className="text-sm font-bold text-emerald-800 mt-0.5">{uploadResult.rows}</p>
                  </div>
                </>
              )}
              {uploadResult.columns != null && (
                <>
                  <div className="w-px h-8 bg-emerald-200/60" />
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Columns</p>
                    <p className="text-sm font-bold text-emerald-800 mt-0.5">{uploadResult.columns}</p>
                  </div>
                </>
              )}
              {uploadResult.file_size != null && (
                <>
                  <div className="w-px h-8 bg-emerald-200/60" />
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Size</p>
                    <p className="text-sm font-bold text-emerald-800 mt-0.5">{uploadResult.file_size}</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className="px-7 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-br from-accent to-accent-light text-white shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              Upload Another Dataset
            </button>
          </div>
        ) : (
          /* --- Upload Drop Zone --- */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`rounded-2xl p-12 text-center transition-all cursor-pointer border-2 border-dashed flex flex-col items-center justify-center min-h-[300px] ${
              dragOver
                ? 'border-accent bg-gradient-to-br from-blue-50/80 to-blue-50/30 shadow-inner scale-[1.01]'
                : 'border-border/70 hover:border-accent/40 hover:bg-gray-50/50'
            }`}
            onClick={() => !file && !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              /* --- Uploading State --- */
              <div className="py-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-accent">Uploading Dataset...</p>
                <p className="text-xs text-gray-400 mt-1.5">Please wait while your file is being processed.</p>
                <div className="mt-6 max-w-xs mx-auto w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            ) : file ? (
              /* --- File Selected State --- */
              <div className="py-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5 shadow-sm">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  ✅ Selected File: <span className="text-accent font-bold">{file.name}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpload() }}
                    className="px-7 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-br from-accent to-accent-light text-white shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    ⬆️ Click Here to Upload Dataset
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* --- Initial Upload State --- */
              <>
                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all mb-5 shadow-sm ${
                  dragOver ? 'bg-accent/10 scale-110' : 'bg-gray-50'
                }`}>
                  <svg className={`w-8 h-8 transition-colors ${dragOver ? 'text-accent' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-base font-extrabold text-navy tracking-tight">Upload Your Dataset</p>
                <p className="text-sm text-gray-400 mt-1.5">Drag & Drop your CSV file here</p>
                <p className="text-xs text-gray-400 mt-4 font-medium">or</p>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="mt-4 px-7 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-br from-accent to-accent-light text-white shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                  📂 Click Here to Choose CSV File
                </button>
                <p className="text-xs text-gray-300 mt-5">Supports .csv files up to 200MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Existing Datasets */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            <div>
              <h3 className="text-base font-extrabold text-navy tracking-tight">Existing Datasets</h3>
              <p className="text-xs text-gray-400 mt-0.5">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            <select
              value={selectedDataset}
              onChange={handleDatasetSelect}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none cursor-pointer"
            >
              <option value="">Select a dataset...</option>
              {datasets.map((ds) => (
                <option key={ds.dataset_id || ds} value={ds.dataset_id || ds}>{ds.filename || ds}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50">
              <svg className="w-5 h-5 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm font-medium text-gray-500">Loading datasets...</p>
            </div>
          </div>
        ) : datasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">No datasets uploaded yet.</p>
            <p className="text-xs text-gray-300 mt-1">Upload a CSV file above to get started.</p>
          </div>
        ) : !selectedDataset ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">Select a dataset to view its details and metrics.</p>
            <p className="text-xs text-gray-300 mt-1">Choose from the dropdown above.</p>
          </div>
        ) : loadingMetrics ? (
          <div className="flex items-center justify-center py-14">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50">
              <svg className="w-5 h-5 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm font-medium text-gray-500">Loading dataset details...</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {/* Columns */}
            {columns.length > 0 && (
              <div className="p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Columns ({columns.length})</h4>
                <div className="overflow-x-auto rounded-2xl border border-border/60">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Column</th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Data Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors border-t border-border/40">
                          <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">{col.name}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              col.type === 'numerical' || col.type === 'int64' || col.type === 'float64'
                                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50'
                                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50'
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

            {/* Preview Rows */}
            {previewRows.length > 0 && columns.length > 0 && (
              <div className="p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Preview Data ({previewRows.length} rows)</h4>
                <div className="overflow-x-auto rounded-2xl border border-border/60">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">#</th>
                        {columns.map((col) => (
                          <th key={col.name} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{col.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-gray-50/50 transition-colors border-t border-border/40">
                          <td className="px-4 py-3 text-xs font-mono text-gray-400">{ri + 1}</td>
                          {columns.map((col) => (
                            <td key={col.name} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap font-mono">
                              {row[col.name] === null || row[col.name] === undefined ? (
                                <span className="text-gray-300 italic">null</span>
                              ) : String(row[col.name])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Metrics */}
            {metrics && (
              <div className="p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Dataset Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Rows', value: metrics.rows, icon: RowsIcon, color: 'from-blue-500 to-blue-600' },
                    { label: 'Columns', value: metrics.columns, icon: ColsIcon, color: 'from-violet-500 to-violet-600' },
                    { label: 'Missing Values', value: metrics.missing_values ?? 0, icon: MissingIcon, color: metrics.missing_values > 0 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600' },
                    { label: 'Duplicated Rows', value: metrics.duplicated_rows ?? 0, icon: DupIcon, color: metrics.duplicated_rows > 0 ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600' },
                    { label: 'Memory Usage', value: metrics.memory_usage ?? '—', icon: MemIcon, color: 'from-teal-500 to-teal-600' },
                  ].map((m, i) => (
                    <div key={m.label} className="bg-gradient-to-br from-gray-50/80 to-white rounded-2xl p-4 border border-border/60 flex items-center gap-3.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 h-full">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0 shadow-sm`}>
                        <m.icon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">{m.label}</p>
                        <p className="text-sm font-extrabold text-navy mt-0.5">{m.value ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EDA Visualizations */}
            {(edaData || loadingEda) && (
              <div className="border-t border-border/60">
                {loadingEda ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50">
                      <svg className="w-5 h-5 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">Analyzing dataset...</p>
                    </div>
                  </div>
                ) : edaData && (
                  <div className="divide-y divide-border/60">
                    {/* Dataset Insights */}
                    <div className="p-6">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Dataset Insights</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Total Rows', value: edaData.total_rows?.toLocaleString(), color: 'from-blue-500 to-blue-600' },
                          { label: 'Total Columns', value: edaData.total_columns, color: 'from-violet-500 to-violet-600' },
                          { label: 'Numeric Columns', value: edaData.numeric_columns?.length ?? 0, color: 'from-emerald-500 to-emerald-600' },
                          { label: 'Categorical Columns', value: edaData.categorical_columns?.length ?? 0, color: 'from-amber-500 to-amber-600' },
                        ].map((insight) => (
                          <div key={insight.label} className="bg-gradient-to-br from-gray-50/80 to-white rounded-2xl p-4 border border-border/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${insight.color} flex items-center justify-center shrink-0 shadow-sm`} />
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{insight.label}</p>
                                <p className="text-base font-extrabold text-navy mt-0.5">{insight.value}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Missing Values */}
                    {edaData.missing_values && Object.keys(edaData.missing_values).length > 0 && (
                      <div className="p-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Missing Values by Column</h4>
                        <div className="bg-gray-50/50 rounded-2xl p-4">
                          <ResponsiveContainer width="100%" height={Math.max(200, Object.keys(edaData.missing_values).length * 32)}>
                            <BarChart
                              data={Object.entries(edaData.missing_values).map(([k, v]) => ({ name: k.length > 22 ? k.slice(0, 22) + '...' : k, count: v })).sort((a, b) => b.count - a.count)}
                              layout="vertical"
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis type="number" tick={{ fontSize: 11 }} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                              <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Histograms */}
                    {edaData.histograms && Object.keys(edaData.histograms).length > 0 && (
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Histograms</h4>
                          <select
                            value={selectedHistCol}
                            onChange={(e) => setSelectedHistCol(e.target.value)}
                            className="text-xs bg-gray-50 border border-border/70 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/20"
                          >
                            {Object.keys(edaData.histograms).map((col) => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                        {selectedHistCol && edaData.histograms[selectedHistCol] && (() => {
                          const h = edaData.histograms[selectedHistCol]
                          const chartData = []
                          for (let i = 0; i < h.counts.length; i++) {
                            chartData.push({ bin: `${Number(h.bins[i]).toFixed(1)}-${Number(h.bins[i + 1]).toFixed(1)}`, count: h.counts[i] })
                          }
                          return (
                            <div className="bg-gray-50/50 rounded-2xl p-4">
                              <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
                                  <YAxis tick={{ fontSize: 11 }} />
                                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Box Plots */}
                    {edaData.box_plots && Object.keys(edaData.box_plots).length > 0 && (
                      <div className="p-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Box Plots</h4>
                        <div className="overflow-x-auto">
                          <div className="flex gap-6 pb-2" style={{ minWidth: Object.keys(edaData.box_plots).length * 100 }}>
                            {Object.entries(edaData.box_plots).slice(0, 20).map(([col, s]) => {
                              const rng = s.max - s.min || 1
                              return (
                                <div key={col} className="flex flex-col items-center min-w-[80px]">
                                  <p className="text-[10px] text-gray-400 mb-1 truncate w-full text-center" title={col}>{col.length > 12 ? col.slice(0, 12) + '...' : col}</p>
                                  <div className="relative w-12 h-40 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="w-full rounded-sm absolute" style={{ height: `${((s.q3 - s.q1) / rng) * 100}%`, backgroundColor: '#3b82f6', opacity: 0.3, bottom: `${((s.q1 - s.min) / rng) * 100}%` }} />
                                    <div className="w-0.5 bg-navy absolute" style={{ height: '100%', left: '50%', bottom: 0 }} />
                                    <div className="w-3 h-0.5 bg-navy absolute" style={{ left: '50%', bottom: `${((s.median - s.min) / rng) * 100}%`, transform: 'translateX(-50%)' }} />
                                    <div className="w-0.5 bg-gray-400 absolute" style={{ height: `${((s.max - s.q3) / rng) * 100}%`, left: '50%', bottom: `${((s.q3 - s.min) / rng) * 100}%` }} />
                                    <div className="w-0.5 bg-gray-400 absolute" style={{ height: `${((s.q1 - s.min) / rng) * 100}%`, left: '50%', bottom: 0 }} />
                                  </div>
                                  <p className="text-[9px] text-gray-400 mt-1">{s.min.toFixed(1)} - {s.max.toFixed(1)}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Correlation Heatmap */}
                    {edaData.correlation && (
                      <div className="p-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Correlation Matrix</h4>
                        <div className="overflow-x-auto bg-gray-50/50 rounded-2xl p-4">
                          <table className="text-xs border-collapse mx-auto">
                            <thead>
                              <tr>
                                <th className="p-1.5" />
                                {edaData.correlation.columns.map((c) => (
                                  <th key={c} className="p-1.5 text-gray-500 font-semibold text-[10px] max-w-[80px] truncate" title={c}>{c}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {edaData.correlation.values.map((row, i) => {
                                const maxVal = Math.max(...edaData.correlation.values.flat().map(Math.abs))
                                return (
                                  <tr key={i}>
                                    <td className="p-1.5 text-gray-500 font-semibold text-[10px] max-w-[80px] truncate text-right" title={edaData.correlation.columns[i]}>{edaData.correlation.columns[i]}</td>
                                    {row.map((val, j) => {
                                      const intensity = maxVal > 0 ? Math.abs(val) / maxVal : 0
                                      const r = val >= 0 ? Math.round(25 + (60 - 25) * intensity) : Math.round(180 - (180 - 60) * intensity)
                                      const g = val >= 0 ? Math.round(80 + (140 - 80) * (1 - intensity)) : Math.round(80 + (60 - 80) * intensity)
                                      const b = val >= 0 ? Math.round(140 + (200 - 140) * (1 - intensity)) : Math.round(80 + (50 - 80) * intensity)
                                      return (
                                        <td key={j} className="p-2 text-center font-bold min-w-[44px] rounded" style={{ backgroundColor: `rgb(${r},${g},${b})`, color: intensity > 0.5 ? '#fff' : '#1a2332' }}>
                                          {val.toFixed(2)}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                          <p className="text-[10px] text-gray-400 text-center mt-2">Pearson correlation coefficient</p>
                        </div>
                      </div>
                    )}

                    {/* Class Distributions */}
                    {edaData.class_distributions && Object.keys(edaData.class_distributions).length > 0 && (
                      <div className="p-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Class Distributions</h4>
                        <div className="space-y-6">
                          {Object.entries(edaData.class_distributions).map(([col, dist]) => {
                            const chartData = dist.labels.map((label, i) => ({
                              name: String(label).length > 18 ? String(label).slice(0, 18) + '...' : String(label),
                              count: dist.counts[i],
                            })).sort((a, b) => b.count - a.count)
                            return (
                              <div key={col}>
                                <p className="text-sm font-bold text-gray-700 mb-2">{col}</p>
                                <div className="bg-gray-50/50 rounded-2xl p-4">
                                  <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 28)}>
                                    <BarChart data={chartData} layout="vertical">
                                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                      <XAxis type="number" tick={{ fontSize: 11 }} />
                                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
