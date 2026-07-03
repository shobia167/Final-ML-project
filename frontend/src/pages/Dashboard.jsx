import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:5000/dashboard')
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="section-heading"><h2>Dashboard</h2><div className="divider" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-base p-6 animate-shimmer rounded-xl">
              <div className="h-10 w-10 rounded-xl bg-gray-200/50 mb-4" />
              <div className="h-4 w-24 bg-gray-200/50 rounded mb-2" />
              <div className="h-7 w-16 bg-gray-200/50 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card-base p-6 lg:col-span-2 animate-shimmer rounded-xl">
            <div className="h-5 w-32 bg-gray-200/50 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200/50 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="card-base p-6 animate-shimmer rounded-xl">
            <div className="h-5 w-28 bg-gray-200/50 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200/50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="section-heading"><h2>Dashboard</h2><div className="divider" /></div>
        <div className="card-base p-12 rounded-xl text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="text-gray-500 font-medium">Could not connect to the backend server.</p>
          <p className="text-sm text-gray-400 mt-1">Make sure the Flask server is running on port 5000.</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Datasets', value: stats.datasets ?? 0, icon: DatasetIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Trained Models', value: stats.models ?? 0, icon: ModelIcon, color: 'from-violet-500 to-violet-600' },
    { label: 'Total Predictions', value: stats.predictions ?? 0, icon: PredictIcon, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Algorithms', value: stats.algorithms ?? 0, icon: AlgorithmIcon, color: 'from-amber-500 to-amber-600' },
  ]

  const recentActivity = stats.recent_activity ?? []
  const recentModels = stats.recent_models ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-heading"><h2>Dashboard</h2><div className="divider" /></div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`card-base p-5 card-hover stagger-${i + 1} animate-fade-in-up`}
          >
            <div className="flex items-start justify-between mb-3" >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                <card.icon />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{card.label}</p>
            <p className="text-2xl font-bold text-navy mt-0.5 font-[family-name:Plus_Jakarta_Sans]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity & Models */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Feed */}
        <div className="card-base p-5 lg:col-span-2 animate-fade-in-up stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-navy">Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-10">
              <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">No activity yet. Upload a dataset to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    act.type === 'upload' ? 'bg-blue-500' :
                    act.type === 'training' ? 'bg-violet-500' :
                    act.type === 'predict' ? 'bg-emerald-500' : 'bg-gray-400'
                  } ${act.type === 'upload' ? 'animate-pulse-soft' : ''}`} />
                  <p className="text-sm text-gray-600 leading-snug flex-1 min-w-0">
                    <span className="font-medium text-gray-800">{act.message}</span>
                  </p>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">{act.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Models */}
        <div className="card-base p-5 animate-fade-in-up stagger-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-navy">Recent Models</h3>
            <Link to="/my-models" className="text-xs font-semibold text-accent hover:text-accent-light transition-colors">View All</Link>
          </div>
          {recentModels.length === 0 ? (
            <div className="text-center py-10">
              <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              <p className="text-sm text-gray-400">No models trained yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentModels.map((model, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{model.name}</p>
                      <p className="text-xs text-gray-400">{model.algorithm}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">{model.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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
