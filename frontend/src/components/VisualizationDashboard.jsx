import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, Cell, ReferenceLine,
} from 'recharts'

const API = 'http://localhost:5000'

function downloadSVG(svgEl, filename) {
  if (!svgEl) return
  const clone = svgEl.cloneNode(true)
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  styles.forEach((s) => clone.insertBefore(s.cloneNode(true), clone.firstChild))
  const svgData = new XMLSerializer().serializeToString(clone)
  const canvas = document.createElement('canvas')
  const rect = svgEl.getBoundingClientRect()
  canvas.width = rect.width * 2
  canvas.height = rect.height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  const img = new Image()
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  img.onload = () => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, rect.width, rect.height)
    URL.revokeObjectURL(url)
    const a = document.createElement('a')
    a.download = `${filename}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }
  img.src = url
}

function ChartCard({ title, children }) {
  const chartRef = useRef(null)
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <h3 className="text-sm font-bold text-navy">{title}</h3>
        </div>
        <button
          onClick={() => {
            const svg = chartRef.current?.querySelector('svg.recharts-surface')
            if (svg) downloadSVG(svg, title.replace(/\s+/g, '_').toLowerCase())
          }}
          className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          PNG
        </button>
      </div>
      <div ref={chartRef} className="p-6">{children}</div>
    </div>
  )
}

function HeatmapGrid({ data, columns, label }) {
  if (!data || !columns) return null
  const maxVal = Math.max(...data.flat().map(Math.abs))
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse mx-auto">
        <thead>
          <tr>
            <th className="p-1.5" />
            {columns.map((c) => (
              <th key={c} className="p-1.5 text-gray-500 font-semibold text-[10px] max-w-[80px] truncate" title={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="p-1.5 text-gray-500 font-semibold text-[10px] max-w-[80px] truncate text-right" title={columns[i]}>{columns[i]}</td>
              {row.map((val, j) => {
                const intensity = maxVal > 0 ? Math.abs(val) / maxVal : 0
                const r = val >= 0 ? Math.round(25 + (60 - 25) * intensity) : Math.round(180 - (180 - 60) * intensity)
                const g = val >= 0 ? Math.round(80 + (140 - 80) * (1 - intensity)) : Math.round(80 + (60 - 80) * intensity)
                const b = val >= 0 ? Math.round(140 + (200 - 140) * (1 - intensity)) : Math.round(80 + (50 - 80) * intensity)
                return (
                  <td
                    key={j}
                    className="p-2 text-center font-bold min-w-[44px] rounded"
                    style={{ backgroundColor: `rgb(${r},${g},${b})`, color: intensity > 0.5 ? '#fff' : '#1a2332' }}
                  >
                    {val.toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {label && <p className="text-[10px] text-gray-400 text-center mt-2">{label}</p>}
    </div>
  )
}

function HistogramChart({ data }) {
  if (!data?.bins) return null
  const chartData = []
  for (let i = 0; i < data.counts.length; i++) {
    chartData.push({
      bin: `${data.bins[i].toFixed(1)}-${data.bins[i + 1].toFixed(1)}`,
      count: data.counts[i],
      rangeMin: data.bins[i],
      rangeMax: data.bins[i + 1],
    })
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="bin" tick={{ fontSize: 10 }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function BoxPlotChart({ data }) {
  if (!data) return null
  const items = Object.entries(data).slice(0, 20).map(([name, stats]) => ({
    name: name.length > 12 ? name.slice(0, 12) + '…' : name,
    ...stats,
  }))
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 pb-2" style={{ minWidth: items.length * 100 }}>
        {items.map((item) => (
          <div key={item.name} className="flex flex-col items-center min-w-[80px]">
            <p className="text-[10px] text-gray-400 mb-1 truncate w-full text-center">{item.name}</p>
            <div className="relative w-12 h-40 bg-gray-50 rounded-lg border border-gray-200">
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full px-1">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: `${((item.q3 - item.q1) / (item.max - item.min || 1)) * 100}%`,
                    backgroundColor: '#3b82f6',
                    opacity: 0.3,
                    position: 'absolute',
                    bottom: `${((item.q1 - item.min) / (item.max - item.min || 1)) * 100}%`,
                  }}
                />
                <div
                  className="w-0.5 bg-navy absolute"
                  style={{
                    height: '100%',
                    left: '50%',
                    bottom: 0,
                  }}
                />
                <div
                  className="w-3 h-0.5 bg-navy absolute"
                  style={{
                    left: '50%',
                    bottom: `${((item.median - item.min) / (item.max - item.min || 1)) * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
                <div
                  className="w-0.5 bg-gray-400 absolute"
                  style={{
                    height: `${((item.max - item.q3) / (item.max - item.min || 1)) * 100}%`,
                    left: '50%',
                    bottom: `${((item.q3 - item.min) / (item.max - item.min || 1)) * 100}%`,
                  }}
                />
                <div
                  className="w-0.5 bg-gray-400 absolute"
                  style={{
                    height: `${((item.q1 - item.min) / (item.max - item.min || 1)) * 100}%`,
                    left: '50%',
                    bottom: 0,
                  }}
                />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">
              {item.min.toFixed(1)} - {item.max.toFixed(1)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CorrelationHeatmap({ data }) {
  if (!data) return null
  return <HeatmapGrid data={data.values} columns={data.columns} label="Pearson correlation coefficient" />
}

function ClassDistributionChart({ data }) {
  if (!data) return null
  const chartData = data.labels.map((label, i) => ({ name: String(label).length > 15 ? String(label).slice(0, 15) + '…' : String(label), count: data.counts[i] }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ConfusionMatrixChart({ data }) {
  if (!data) return null
  return <HeatmapGrid data={data.matrix} columns={data.labels} label="Confusion Matrix (row=actual, col=predicted)" />
}

function ROCCurve({ data }) {
  if (!data) return null
  const chartData = data.fpr.map((f, i) => ({ fpr: f, tpr: data.tpr[i] }))
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="fpr" tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'False Positive Rate', position: 'bottom', fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'True Positive Rate', angle: -90, position: 'left', fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line type="monotone" dataKey="tpr" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <ReferenceLine x={0} y={0} stroke="#ccc" />
          <ReferenceLine x={1} y={1} stroke="#ccc" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-500 mt-1">AUC = {data.auc.toFixed(4)}</p>
    </div>
  )
}

function PRCurve({ data }) {
  if (!data) return null
  const chartData = data.recall.map((r, i) => ({ recall: r, precision: data.precision[i] }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="recall" tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'Recall', position: 'bottom', fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'Precision', angle: -90, position: 'left', fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey="precision" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function ActualVsPredicted({ data }) {
  if (!data) return null
  const chartData = data.actual.map((a, i) => ({ actual: a, predicted: data.predicted[i] }))
  const allVals = [...data.actual, ...data.predicted]
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="actual" tick={{ fontSize: 11 }} domain={[min, max]} label={{ value: 'Actual', position: 'bottom', fontSize: 11 }} />
          <YAxis dataKey="predicted" tick={{ fontSize: 11 }} domain={[min, max]} label={{ value: 'Predicted', angle: -90, position: 'left', fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Scatter data={chartData} fill="#3b82f6" opacity={0.6} />
          <ReferenceLine x={min} y={min} slope={1} stroke="#ccc" strokeDasharray="5 5" />
          <ReferenceLine x={max} y={max} slope={1} stroke="#ccc" strokeDasharray="5 5" />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-500 mt-1">Ideal: points on diagonal line</p>
    </div>
  )
}

function FeatureImportanceChart({ data }) {
  if (!data) return null
  const items = data.features.slice(0, 20)
  const chartData = items.map((f, i) => ({ name: f.length > 18 ? f.slice(0, 18) + '…' : f, importance: data.importance[i] })).reverse()
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, items.length * 24)}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="importance" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ShapSummaryChart({ data }) {
  if (!data) return null
  const items = data.features.slice(0, 20)
  const chartData = items.map((f, i) => ({
    name: f.length > 15 ? f.slice(0, 15) + '…' : f,
    impact: data.mean_abs_shap[i],
    min: data.min[i],
    max: data.max[i],
  })).reverse()
  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(200, items.length * 24)}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: 'Mean |Impact|', position: 'bottom', fontSize: 10 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => v.toFixed(4)} />
          <Bar dataKey="impact" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-center text-[10px] text-gray-400 mt-1">Feature impact estimation (higher = more influence on predictions)</p>
    </div>
  )
}

export default function VisualizationDashboard({ modelId, datasetId }) {
  const [activeTab, setActiveTab] = useState('eda')
  const [edaData, setEdaData] = useState(null)
  const [evalData, setEvalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCol, setSelectedCol] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportUrl, setReportUrl] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const promises = []
        if (datasetId) {
          promises.push(fetch(`${API}/api/dataset/${datasetId}/eda`).then(r => r.json()).catch(() => null))
        }
        if (modelId) {
          promises.push(fetch(`${API}/api/model/${modelId}/evaluation`).then(r => r.json()).catch(() => null))
        }
        const results = await Promise.all(promises)
        if (datasetId) {
          const eda = results.shift()
          if (eda?.histograms) setEdaData(eda)
        }
        if (modelId) {
          const ev = results.shift()
          if (ev?.algorithm) setEvalData(ev)
        }
      } catch {
        setError('Failed to load visualization data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [modelId, datasetId])

  useEffect(() => {
    if (edaData?.numeric_columns?.length) {
      setSelectedCol(edaData.numeric_columns[0])
    }
  }, [edaData])

  const handleGenerateReport = useCallback(async () => {
    if (!modelId) return
    setReportLoading(true)
    try {
      const res = await fetch(`${API}/api/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId }),
      })
      const data = await res.json()
      if (res.ok) {
        setReportUrl(data.report_url)
      } else {
        setError(data.error || 'Report generation failed')
      }
    } catch {
      setError('Failed to generate report')
    } finally {
      setReportLoading(false)
    }
  }, [modelId])

  const tabs = [
    { id: 'eda', label: 'EDA', icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5' },
    { id: 'correlation', label: 'Correlation', icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25' },
    { id: 'evaluation', label: 'Evaluation', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
    { id: 'features', label: 'Features', icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-3">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
        {/* Spacer */}
        <div className="flex-1" />
        {/* Report button */}
        {modelId && (
          <button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              reportLoading ? 'bg-gray-100 text-gray-400 cursor-wait' : 'bg-navy text-white hover:bg-navy-light'
            }`}
          >
            {reportLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            )}
            {reportLoading ? 'Generating...' : 'PDF Report'}
          </button>
        )}
        {reportUrl && (
          <a
            href={`${API}${reportUrl}`}
            download
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-all whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF
          </a>
        )}
      </div>

      {/* EDA Tab */}
      {activeTab === 'eda' && edaData && (
        <div className="space-y-6">
          {/* Dataset summary */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Dataset</p>
                <p className="font-semibold text-navy mt-1">{edaData.dataset_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Rows</p>
                <p className="font-semibold text-navy mt-1">{edaData.total_rows?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Columns</p>
                <p className="font-semibold text-navy mt-1">{edaData.total_columns}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Numeric</p>
                <p className="font-semibold text-navy mt-1">{edaData.numeric_columns?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Histogram */}
          {edaData.histograms && Object.keys(edaData.histograms).length > 0 && (
            <ChartCard title={`Distribution: ${selectedCol || ''}`}>
              <div className="mb-3">
                <select
                  value={selectedCol}
                  onChange={(e) => setSelectedCol(e.target.value)}
                  className="text-sm border border-border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {Object.keys(edaData.histograms).map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              {selectedCol && edaData.histograms[selectedCol] && (
                <HistogramChart data={edaData.histograms[selectedCol]} />
              )}
            </ChartCard>
          )}

          {/* Box Plots */}
          {edaData.box_plots && Object.keys(edaData.box_plots).length > 0 && (
            <ChartCard title="Box Plots">
              <BoxPlotChart data={edaData.box_plots} />
            </ChartCard>
          )}

          {/* Class Distributions */}
          {edaData.class_distributions && Object.keys(edaData.class_distributions).length > 0 && (
            <div className="space-y-6">
              {Object.entries(edaData.class_distributions).map(([col, dist]) => (
                <ChartCard key={col} title={`Distribution: ${col}`}>
                  <ClassDistributionChart data={dist} />
                </ChartCard>
              ))}
            </div>
          )}

          {/* Missing Values */}
          {edaData.missing_values && Object.keys(edaData.missing_values).length > 0 && (
            <ChartCard title="Missing Values">
              <ResponsiveContainer width="100%" height={Math.max(200, Object.keys(edaData.missing_values).length * 30)}>
                <BarChart
                  data={Object.entries(edaData.missing_values).map(([col, count]) => ({ name: col, missing: count })).reverse()}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="missing" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Correlation Tab */}
      {activeTab === 'correlation' && edaData?.correlation && (
        <ChartCard title="Correlation Heatmap">
          <CorrelationHeatmap data={edaData.correlation} />
        </ChartCard>
      )}
      {activeTab === 'correlation' && (!edaData?.correlation) && (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <p className="text-sm text-gray-400">Not enough numeric columns for correlation analysis.</p>
        </div>
      )}

      {/* Evaluation Tab */}
      {activeTab === 'evaluation' && evalData && (
        <div className="space-y-6">
          {/* Confusion Matrix (classification) */}
          {evalData.confusion_matrix && (
            <ChartCard title="Confusion Matrix">
              <ConfusionMatrixChart data={evalData.confusion_matrix} />
            </ChartCard>
          )}

          {/* ROC Curve (binary classification) */}
          {evalData.roc_curve && (
            <ChartCard title="ROC Curve">
              <ROCCurve data={evalData.roc_curve} />
            </ChartCard>
          )}

          {/* PR Curve (binary classification) */}
          {evalData.pr_curve && (
            <ChartCard title="Precision-Recall Curve">
              <PRCurve data={evalData.pr_curve} />
            </ChartCard>
          )}

          {/* Class Distribution (classification) */}
          {evalData.class_distribution && (
            <ChartCard title="Class Distribution in Evaluation">
              <ClassDistributionChart data={evalData.class_distribution} />
            </ChartCard>
          )}

          {/* Actual vs Predicted (regression) */}
          {evalData.actual_vs_predicted && (
            <ChartCard title="Actual vs Predicted">
              <ActualVsPredicted data={evalData.actual_vs_predicted} />
            </ChartCard>
          )}

          {/* Residuals (regression) */}
          {evalData.residuals && (
            <ChartCard title="Residuals">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={evalData.residuals.map((v, i) => ({ index: i, residual: v }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="index" tick={false} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <ReferenceLine y={0} stroke="#ccc" />
                  <Bar dataKey="residual" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                    {evalData.residuals.map((v) => (
                      <Cell key={v} fill={v >= 0 ? '#3b82f6' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {!evalData.confusion_matrix && !evalData.actual_vs_predicted && (
            <div className="bg-white rounded-2xl border border-border p-10 text-center">
              <p className="text-sm text-gray-400">No evaluation data available for this model type.</p>
            </div>
          )}
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Feature Importance */}
          {evalData?.feature_importance && (
            <ChartCard title="Feature Importance">
              <FeatureImportanceChart data={evalData.feature_importance} />
            </ChartCard>
          )}

          {/* SHAP Summary */}
          {evalData?.shap_summary && (
            <ChartCard title="Feature Impact (SHAP-style)">
              <ShapSummaryChart data={evalData.shap_summary} />
            </ChartCard>
          )}

          {/* Feature list */}
          {evalData && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                Features Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {edaData?.numeric_columns?.map((col) => (
                  <span key={col} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200/50">{col}</span>
                ))}
                {edaData?.categorical_columns?.map((col) => (
                  <span key={col} className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-200/50">{col}</span>
                ))}
              </div>
            </div>
          )}

          {!evalData?.feature_importance && !evalData?.shap_summary && (
            <div className="bg-white rounded-2xl border border-border p-10 text-center">
              <p className="text-sm text-gray-400">No feature importance data available for this model.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
