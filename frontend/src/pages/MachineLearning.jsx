import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'

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

const taskLabels = {
  classification: 'Classification',
  regression: 'Regression',
  clustering: 'Clustering',
  dim_reduction: 'Dim. Reduction',
  anomaly: 'Anomaly Detection',
  semi_supervised: 'Semi-Supervised',
  association: 'Association Rules',
}

export default function MachineLearning() {
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const [searchParams] = useSearchParams()
  const [learningType, setLearningType] = useState(null)
  const [learningTypes, setLearningTypes] = useState([])
  const [algorithms, setAlgorithms] = useState([])
  const [algoInfo, setAlgoInfo] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null)
  const [columns, setColumns] = useState([])
  const [targetColumn, setTargetColumn] = useState('')
  const [testSize, setTestSize] = useState(20)
  const [randomState, setRandomState] = useState(42)
  const [training, setTraining] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingColumns, setLoadingColumns] = useState(false)
  const pendingAlgoIdRef = useRef(null)
  const initializedFromUrl = useRef(false)

  const handleSelectType = useCallback(async (type) => {
    setLearningType(type)
    setSelectedAlgorithm(null)
    setResults(null)
    setError(null)
    setTargetColumn('')
    setColumns([])
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/algorithms/${type}`)
      const data = await res.json()
      if (data.info_only) {
        setAlgoInfo(data)
        setAlgorithms([])
      } else {
        setAlgorithms(data.algorithms || [])
        setAlgoInfo(null)
      }
    } catch {
      setError('Failed to load algorithms')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch(`${API}/api/algorithms`)
      .then((r) => r.json())
      .then((types) => {
        setLearningTypes(types)
        const typeParam = searchParams.get('type')
        const algoParam = searchParams.get('algo')
        if (typeParam && types.some((t) => t.id === typeParam)) {
          handleSelectType(typeParam)
          if (algoParam) {
            pendingAlgoIdRef.current = algoParam
          }
        }
        initializedFromUrl.current = true
      })
      .catch(() => {})
    fetch(`${API}/api/datasets`)
      .then((r) => r.json())
      .then(setDatasets)
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectAlgorithm = useCallback((algo) => {
    setSelectedAlgorithm(algo)
    setResults(null)
    setError(null)
    if (algo.task === 'clustering' || algo.task === 'dim_reduction' || algo.task === 'anomaly' || algo.task === 'association') {
      setTargetColumn('__none__')
    } else {
      setTargetColumn('')
    }
  }, [])

  const handleDatasetChange = useCallback(async (dsId) => {
    setSelectedDatasetId(dsId)
    setTargetColumn('')
    setResults(null)
    if (!dsId) return
    setLoadingColumns(true)
    try {
      const res = await fetch(`${API}/api/dataset/${dsId}/preview`)
      const data = await res.json()
      if (res.ok) setColumns(data.columns || [])
    } catch {
      setColumns([])
    } finally {
      setLoadingColumns(false)
    }
  }, [])

  const handleTrain = useCallback(async () => {
    if (!selectedAlgorithm || !selectedDatasetId) return
    setTraining(true)
    setError(null)
    setResults(null)
    try {
      const body = {
        dataset_id: selectedDatasetId,
        algorithm_id: selectedAlgorithm.id,
        test_size: testSize / 100,
        random_state: randomState || null,
      }
      const needsTarget = !['clustering', 'dim_reduction', 'anomaly', 'association'].includes(selectedAlgorithm.task)
      if (needsTarget) {
        if (!targetColumn || targetColumn === '__none__') {
          setError('Please select a target column for this algorithm')
          setTraining(false)
          return
        }
        body.target_column = targetColumn
      }
      const res = await fetch(`${API}/api/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data)
        addNotification({ type: 'success', title: 'Model Trained', message: `${selectedAlgorithm.name} trained successfully`, category: 'training' })
      } else {
        setError(data.error || 'Training failed')
        addNotification({ type: 'error', title: 'Training Failed', message: data.error || 'Training failed', category: 'training' })
      }
    } catch {
      setError('Failed to connect to training server')
      addNotification({ type: 'error', title: 'Training Failed', message: 'Failed to connect to training server', category: 'training' })
    } finally {
      setTraining(false)
    }
  }, [selectedAlgorithm, selectedDatasetId, targetColumn, testSize, randomState])

  const handleBack = useCallback(() => {
    if (selectedAlgorithm) {
      setSelectedAlgorithm(null)
      setResults(null)
      setError(null)
    } else if (learningType) {
      setLearningType(null)
      setAlgorithms([])
      setAlgoInfo(null)
      setSelectedAlgorithm(null)
      setResults(null)
      setError(null)
    }
  }, [learningType, selectedAlgorithm])

  // --- INITIAL: Show learning type cards ---
  if (!learningType) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {learningTypes.map((lt, i) => (
            <button
              key={lt.id}
              onClick={() => handleSelectType(lt.id)}
              className={`bg-white rounded-2xl border border-border card-hover animate-fade-in-up stagger-${i + 1} text-left w-full`}
            >
              <div className="p-6 md:p-7">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${lt.id === 'supervised' ? 'bg-navy' : lt.id === 'unsupervised' ? 'bg-accent' : lt.id === 'semi_supervised' ? 'bg-navy-lighter' : 'bg-accent'} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                    {lt.icon}
                  </div>
                  {lt.info_only && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 ring-1 ring-amber-200/50">
                      Coming Soon
                    </span>
                  )}
                  {!lt.info_only && (
                    <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                      {lt.algorithm_count} algos
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-navy tracking-tight font-[family-name:Plus_Jakarta_Sans]">{lt.display_name}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{lt.description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent group">
                  <span>{lt.info_only ? 'View details' : 'Explore algorithms'}</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // --- INFO ONLY (Reinforcement Learning) ---
  if (algoInfo?.info_only) {
    return (
      <div className="space-y-8 animate-fade-in">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Learning Types
        </button>
        <div className="bg-white rounded-2xl border border-border p-10 md:p-14 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-5 shadow-sm">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-navy font-[family-name:Plus_Jakarta_Sans]">Reinforcement Learning</h3>
          <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">{algoInfo.info_message}</p>
        </div>
      </div>
    )
  }

  // --- ALGORITHM LIST ---
  if (!selectedAlgorithm) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Learning Types
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-5 rounded-full bg-accent" />
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider">{learningTypes.find((lt) => lt.id === learningType)?.display_name || 'Algorithms'}</h2>
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-gray-400">{algorithms.length} algorithms</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10">
            {algorithms.map((algo, i) => (
              <button
                key={algo.id}
                onClick={() => handleSelectAlgorithm(algo)}
                className="bg-white rounded-[20px] border border-border w-full max-w-[820px] animate-fade-in-up flex flex-col items-center text-center p-9 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-white text-sm font-bold shadow-sm mb-4">
                  {algo.icon}
                </div>
                <span className={`inline-block mb-3 text-[11px] font-semibold px-3 py-1 rounded-full ${taskBadgeColors[algo.task] || 'bg-gray-50 text-gray-600'}`}>
                  {taskLabels[algo.task] || algo.task}
                </span>
                <h3 className="text-base font-bold text-navy font-[family-name:Plus_Jakarta_Sans]">{algo.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mt-3 max-w-xl">{algo.description}</p>
                <div className="mt-6 pt-4 border-t border-border w-full flex justify-center">
                  <span className="text-sm font-semibold text-accent flex items-center gap-1.5">
                    Select
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // --- CONFIGURATION & TRAINING ---
  const isUnsupervised = ['clustering', 'dim_reduction', 'anomaly', 'association'].includes(selectedAlgorithm.task)
  const isSemiSupervised = selectedAlgorithm.task === 'semi_supervised'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Title */}
      <div className="flex items-center justify-between">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${taskBadgeColors[selectedAlgorithm.task] || 'bg-gray-50 text-gray-600'}`}>
          {taskLabels[selectedAlgorithm.task] || selectedAlgorithm.task}
        </span>
      </div>

      {/* Algorithm Header */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
            {selectedAlgorithm.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy font-[family-name:Plus_Jakarta_Sans]">{selectedAlgorithm.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{selectedAlgorithm.description}</p>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dataset + Target */}
        <div className="lg:col-span-2 space-y-5">
          {/* Dataset Selection */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              Dataset
            </h3>
            <select
              value={selectedDatasetId}
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="appearance-none w-full px-4 py-2.5 pr-10 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
            >
              <option value="">-- Select a dataset --</option>
              {datasets.map((ds) => (
                <option key={ds.dataset_id} value={ds.dataset_id}>
                  {ds.filename} ({ds.dataset_id})
                </option>
              ))}
            </select>
            {loadingColumns && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Loading columns...
              </div>
            )}
          </div>

          {/* Target Column (not for unsupervised) */}
          {!isUnsupervised && selectedDatasetId && !loadingColumns && columns.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Target Column {isSemiSupervised && <span className="text-[10px] font-normal text-gray-400">(use -1 for unlabeled)</span>}
              </h3>
              <div className="relative">
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="appearance-none w-full px-4 py-2.5 pr-10 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
                >
                  <option value="">-- Select target column --</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              {isSemiSupervised && targetColumn && (
                <p className="mt-2 text-xs text-cyan-600">Semi-supervised: unlabeled rows should have target value = -1</p>
              )}
            </div>
          )}

          {/* Unsupervised info */}
          {isUnsupervised && selectedDatasetId && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg className="w-5 h-5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>This algorithm does not require a target column. It will use all numeric features automatically.</span>
              </div>
            </div>
          )}

          {/* No dataset message */}
          {!selectedDatasetId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-700 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Please upload a dataset first from the <a href="/upload" className="underline font-semibold ml-1">Upload Dataset</a> page, then select it above.
            </div>
          )}
        </div>

        {/* Right: Parameters + Train */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Parameters
            </h3>
            <div className="space-y-4">
              {!isUnsupervised && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Train-Test Split</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="40"
                      value={testSize}
                      onChange={(e) => setTestSize(Number(e.target.value))}
                      className="flex-1 accent-accent h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-navy w-12 text-right">{testSize}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{100 - testSize}% train / {testSize}% test</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Random State</label>
                <input
                  type="number"
                  value={randomState}
                  onChange={(e) => setRandomState(Number(e.target.value))}
                  min="0"
                  max="999"
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
                />
              </div>
            </div>
          </div>

          {/* Train Button */}
          <button
            onClick={handleTrain}
            disabled={training || !selectedDatasetId || (!isUnsupervised && !targetColumn)}
            className={`w-full py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              training || !selectedDatasetId || (!isUnsupervised && !targetColumn)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-accent to-accent-lighter text-white hover:shadow-lg hover:shadow-blue-900/20'
            }`}
          >
            {training ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Training...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
                Train Model
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-3 animate-slide-in">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Results */}
      {results && <ResultsPanel results={results} navigate={navigate} />}
    </div>
  )
}

// --- RESULTS PANEL ---
function ResultsPanel({ results, navigate }) {
  const { algorithm, task, metrics, label, label_color, features, model_id } = results

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Header Badge */}
      <div className={`rounded-2xl border p-5 flex items-center justify-between ${
        label_color === 'green' ? 'bg-green-50 border-green-200 text-green-700' :
        label_color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
        'bg-red-50 border-red-200 text-red-700'
      }`}>
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            {label_color === 'green' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            )}
          </svg>
          <div>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">Training Complete</p>
            <p className="text-lg font-bold font-[family-name:Plus_Jakarta_Sans]">{label}</p>
            {model_id && <p className="text-xs opacity-70 mt-0.5">Model ID: {model_id}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {model_id && (
            <>
              <button
                onClick={() => navigate(`/results?model_id=${model_id}`)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/50 hover:bg-white/80 transition-colors border border-white/30"
              >
                Make Predictions
              </button>
              <button
                onClick={() => navigate(`/results?model_id=${model_id}&tab=visualize`)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/50 hover:bg-white/80 transition-colors border border-white/30"
              >
                Visualizations
              </button>
            </>
          )}
          <span className="text-xs opacity-70">{algorithm}</span>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <h3 className="text-sm font-bold text-navy">Performance Metrics</h3>
          </div>
          <div className="p-6">
            {task === 'classification' && <ClassificationMetrics metrics={metrics} />}
            {task === 'regression' && <RegressionMetrics metrics={metrics} />}
            {task === 'clustering' && <ClusteringMetrics results={results} />}
            {task === 'dim_reduction' && <DimReductionMetrics results={results} />}
            {task === 'anomaly' && <AnomalyMetrics results={results} />}
            {task === 'semi_supervised' && <SemiSupervisedMetrics metrics={metrics} results={results} />}
          </div>
        </div>
      )}

      {/* Confusion Matrix */}
      {results.confusion_matrix && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <h3 className="text-sm font-bold text-navy">Confusion Matrix</h3>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="mx-auto text-sm border-collapse">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  <th className="p-2 text-xs text-gray-500 font-semibold" colSpan={results.confusion_matrix.length}>
                    Predicted
                  </th>
                </tr>
                <tr>
                  <th className="p-2"></th>
                  {results.confusion_matrix[0].map((_, i) => (
                    <th key={i} className="p-2 text-xs text-gray-500 font-semibold">
                      {results.target_classes?.[i] || `Class ${i}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 text-xs text-gray-500 font-semibold align-middle" rowSpan={results.confusion_matrix.length + 1} style={{ writingMode: 'vertical-lr' }}>
                    Actual
                  </td>
                </tr>
                {results.confusion_matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="p-2 text-xs text-gray-500 font-semibold text-center">
                      {results.target_classes?.[i] || `Class ${i}`}
                    </td>
                    {row.map((val, j) => (
                      <td
                        key={j}
                        className={`p-3 text-center font-bold text-sm min-w-[60px] ${
                          i === j
                            ? 'bg-green-50 text-green-700 rounded-lg'
                            : 'bg-red-50 text-red-600 rounded-lg'
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Features info */}
      {features && (
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            Features used: {features.join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

function ClassificationMetrics({ metrics }) {
  const items = [
    { label: 'Accuracy', value: `${(metrics.accuracy * 100).toFixed(1)}%`, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Precision', value: `${(metrics.precision * 100).toFixed(1)}%`, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Recall', value: `${(metrics.recall * 100).toFixed(1)}%`, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
    { label: 'F1 Score', value: `${(metrics.f1_score * 100).toFixed(1)}%`, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{item.label}</p>
          <p className="text-xl font-bold text-navy mt-1 font-[family-name:Plus_Jakarta_Sans]">{item.value}</p>
          <div className={`mt-2 h-1.5 w-full rounded-full bg-gradient-to-r ${item.color} opacity-40`} />
        </div>
      ))}
    </div>
  )
}

function RegressionMetrics({ metrics }) {
  const items = [
    { label: 'MSE', value: metrics.mse, color: 'from-blue-500 to-blue-600' },
    { label: 'RMSE', value: metrics.rmse, color: 'from-emerald-500 to-emerald-600' },
    { label: 'MAE', value: metrics.mae, color: 'from-purple-500 to-purple-600' },
    { label: 'R² Score', value: metrics.r2_score, color: 'from-amber-500 to-amber-600' },
    { label: 'Explained Var.', value: metrics.explained_variance, color: 'from-cyan-500 to-cyan-600' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{item.label}</p>
          <p className="text-lg font-bold text-navy mt-1 font-[family-name:Plus_Jakarta_Sans]">{item.value}</p>
          <div className={`mt-2 h-1 w-full rounded-full bg-gradient-to-r ${item.color} opacity-40`} />
        </div>
      ))}
    </div>
  )
}

function ClusteringMetrics({ results }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Number of Clusters</p>
        <p className="text-lg font-bold text-navy mt-1 font-[family-name:Plus_Jakarta_Sans]">{results.n_clusters}</p>
      </div>
      {results.silhouette_score != null && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Silhouette Score</p>
          <p className="text-lg font-bold text-navy mt-1 font-[family-name:Plus_Jakarta_Sans]">{results.silhouette_score}</p>
        </div>
      )}
      {results.n_noise != null && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Noise Points</p>
          <p className="text-lg font-bold text-navy mt-1 font-[family-name:Plus_Jakarta_Sans]">{results.n_noise}</p>
        </div>
      )}
      {results.inertia != null && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Inertia</p>
          <p className="text-lg font-bold text-navy mt-1 font-[family-name:Plus_Jakarta_Sans]">{results.inertia}</p>
        </div>
      )}
    </div>
  )
}

function DimReductionMetrics({ results }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Original Dims</p>
        <p className="text-lg font-bold text-navy mt-1">{results.original_dimensions}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Reduced Dims</p>
        <p className="text-lg font-bold text-navy mt-1">{results.reduced_dimensions}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Samples</p>
        <p className="text-lg font-bold text-navy mt-1">{results.total_samples}</p>
      </div>
      {results.cumulative_variance != null && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Cumulative Variance</p>
          <p className="text-lg font-bold text-navy mt-1">{(results.cumulative_variance * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  )
}

function AnomalyMetrics({ results }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Total Samples</p>
        <p className="text-lg font-bold text-navy mt-1">{results.total_samples}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Outliers</p>
        <p className="text-lg font-bold text-red-600 mt-1">{results.outliers_detected}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Inliers</p>
        <p className="text-lg font-bold text-green-600 mt-1">{results.inliers}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Outlier %</p>
        <p className="text-lg font-bold text-navy mt-1">{results.outlier_percentage}%</p>
      </div>
    </div>
  )
}

function SemiSupervisedMetrics({ metrics, results }) {
  const items = [
    { label: 'Accuracy', value: `${(metrics.accuracy * 100).toFixed(1)}%`, color: 'from-blue-500 to-blue-600' },
    { label: 'Precision', value: `${(metrics.precision * 100).toFixed(1)}%`, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Recall', value: `${(metrics.recall * 100).toFixed(1)}%`, color: 'from-purple-500 to-purple-600' },
    { label: 'F1 Score', value: `${(metrics.f1_score * 100).toFixed(1)}%`, color: 'from-amber-500 to-amber-600' },
  ]
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {items.map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{item.label}</p>
            <p className="text-xl font-bold text-navy mt-1 font-[family-name:Plus_Jakarta_Sans]">{item.value}</p>
            <div className={`mt-2 h-1.5 w-full rounded-full bg-gradient-to-r ${item.color} opacity-40`} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>Total: {results.total_samples} samples</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>Labeled: {results.labeled_samples}</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>Unlabeled: {results.unlabeled_samples}</span>
      </div>
    </div>
  )
}
