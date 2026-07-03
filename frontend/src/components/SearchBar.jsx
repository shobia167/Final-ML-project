import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000'

const PAGE_ENTRIES = [
  { label: 'Dashboard', description: 'Overview of your machine learning platform', path: '/' },
  { label: 'Upload Dataset', description: 'Upload and analyze your datasets', path: '/upload' },
  { label: 'Machine Learning', description: 'Choose a learning paradigm and train models', path: '/machine-learning' },
  { label: 'Results', description: 'View model performance and make predictions', path: '/results' },
  { label: 'My Models', description: 'Manage your saved trained models', path: '/my-models' },
  { label: 'Settings', description: 'Configure application preferences', path: '/settings' },
]

const SETTINGS_ENTRIES = [
  { label: 'General Settings', description: 'Language, notifications, auto-save', path: '/settings' },
  { label: 'Appearance', description: 'Theme, compact mode', path: '/settings' },
  { label: 'Model Settings', description: 'Storage path, train-test split, checkpoints', path: '/settings' },
  { label: 'Data Settings', description: 'Upload size, encoding, column type detection', path: '/settings' },
  { label: 'Export Settings', description: 'Export format, charts, auto-export', path: '/settings' },
]

export default function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchData, setSearchData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const fetchSearchData = useCallback(async () => {
    if (fetched) return
    setLoading(true)
    const data = { algorithms: [], datasets: [], models: [] }
    try {
      const [algRes, dsRes, modRes] = await Promise.all([
        fetch(`${API}/api/algorithms`).then((r) => r.json()),
        fetch(`${API}/api/datasets`).then((r) => r.json()),
        fetch(`${API}/api/models`).then((r) => r.json()).catch(() => ({ models: [] })),
      ])
      const typePromises = algRes
        .filter((t) => !t.info_only)
        .map((t) =>
          fetch(`${API}/api/algorithms/${t.id}`)
            .then((r) => r.json())
            .then((d) => d.algorithms || [])
            .catch(() => [])
        )
      const nestedAlgos = await Promise.all(typePromises)
      data.algorithms = nestedAlgos.flat()
      data.datasets = Array.isArray(dsRes) ? dsRes : []
      data.models = modRes.models || []
    } catch {}
    setSearchData(data)
    setFetched(true)
    setLoading(false)
  }, [fetched])

  useEffect(() => {
    if (!open) return
    fetchSearchData()
  }, [open, fetchSearchData])

  useEffect(() => {
    setSelectedIndex(-1)
  }, [query])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    const out = []

    PAGE_ENTRIES.forEach((p) => {
      if (p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        out.push({ ...p, category: 'Pages', icon: PageIcon })
      }
    })

    if (searchData) {
      searchData.algorithms.forEach((a) => {
        if (a.name?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q) || a.task?.toLowerCase().includes(q)) {
          out.push({ label: a.name, description: a.description, path: `/machine-learning?algo=${a.id}`, category: 'Algorithms', icon: AlgoIcon })
        }
      })
      searchData.datasets.forEach((d) => {
        if (d.filename?.toLowerCase().includes(q) || d.dataset_id?.toLowerCase().includes(q)) {
          out.push({ label: d.filename, description: `Dataset: ${d.dataset_id}`, path: '/upload', category: 'Datasets', icon: DatasetIcon })
        }
      })
      searchData.models.forEach((m) => {
        if (m.algorithm?.toLowerCase().includes(q) || m.model_id?.toLowerCase().includes(q) || m.dataset_name?.toLowerCase().includes(q)) {
          out.push({ label: m.algorithm, description: `Model: ${m.model_id} — ${m.dataset_name || ''}`, path: `/results?model_id=${m.model_id}`, category: 'Models', icon: ModelIcon })
        }
      })
    }

    SETTINGS_ENTRIES.forEach((s) => {
      if (s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) {
        out.push({ ...s, category: 'Settings', icon: SettingsIcon })
      }
    })

    return out
  }, [query, searchData])

  const visibleResults = results.slice(0, 12)

  const handleSelect = useCallback((result) => {
    setQuery('')
    setOpen(false)
    setFocused(false)
    navigate(result.path)
  }, [navigate])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < visibleResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : visibleResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < visibleResults.length) {
        handleSelect(visibleResults[selectedIndex])
      } else if (visibleResults.length > 0) {
        handleSelect(visibleResults[0])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocused(false)
      inputRef.current?.blur()
    }
  }, [visibleResults, selectedIndex, handleSelect])

  const shouldShow = open && focused && query.trim().length > 0

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-border rounded-xl text-sm text-gray-400 w-48 lg:w-56 transition-all duration-200 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent focus-within:bg-white">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); setFocused(true) }}
          onBlur={() => setTimeout(() => { setFocused(false); setOpen(false) }, 200)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-navy placeholder-gray-400 min-w-0"
          aria-label="Search pages, algorithms, datasets, models, settings"
          autoComplete="off"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {shouldShow && (
        <div className="absolute right-0 top-full mt-2 w-80 lg:w-96 bg-white rounded-2xl border border-border shadow-xl shadow-black/5 overflow-hidden z-50 animate-scale-in origin-top-right">
          {visibleResults.length > 0 ? (
            <div className="max-h-80 overflow-y-auto py-2">
              {groupResults(visibleResults).map((group) => (
                <div key={group.category}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {group.category}
                  </div>
                  {group.items.map((item, i) => {
                    const globalIdx = visibleResults.indexOf(item)
                    return (
                      <button
                        key={`${item.category}-${item.label}-${i}`}
                        onMouseDown={() => handleSelect(item)}
                        className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                          globalIdx === selectedIndex ? 'bg-accent/5' : 'hover:bg-gray-50'
                        }`}
                      >
                        <item.icon />
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium truncate ${globalIdx === selectedIndex ? 'text-accent' : 'text-navy'}`}>
                            {item.label}
                          </div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">{item.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-400">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : (
                <span>No results found for &ldquo;{query}&rdquo;</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function groupResults(results) {
  const groups = []
  const seen = new Set()
  for (const r of results) {
    if (!seen.has(r.category)) {
      seen.add(r.category)
      groups.push({ category: r.category, items: [] })
    }
    groups[groups.length - 1].items.push(r)
  }
  return groups
}

function PageIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
      <svg className="w-3.5 h-3.5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    </div>
  )
}

function AlgoIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    </div>
  )
}

function DatasetIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    </div>
  )
}

function ModelIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    </div>
  )
}

function SettingsIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  )
}
