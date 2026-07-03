import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import SearchBar from './components/SearchBar'
import NotificationDropdown from './components/NotificationDropdown'
import { NotificationProvider } from './context/NotificationContext'
import Dashboard from './pages/Dashboard'
import UploadDataset from './pages/UploadDataset'
import MachineLearning from './pages/MachineLearning'
import Results from './pages/Results'
import MyModels from './pages/MyModels'
import Settings from './pages/Settings'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-surface flex relative">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <header className="h-16 bg-white border-b border-border sticky top-0 z-30 shrink-0">
            <div className="h-full px-5 lg:px-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 -ml-1 rounded-lg hover:bg-surface transition-colors lg:hidden"
                  aria-label="Open menu"
                >
                  <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>
                <div className="hidden sm:block">
                  <p className="text-xs text-gray-400">Welcome back</p>
                  <p className="text-sm font-semibold text-navy -mt-0.5">ML Dashboard</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <SearchBar />
                <NotificationDropdown />
              </div>
            </div>
          </header>

          <main className="flex-1 p-5 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadDataset />} />
              <Route path="/machine-learning" element={<MachineLearning />} />
              <Route path="/results" element={<Results />} />
              <Route path="/my-models" element={<MyModels />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}
