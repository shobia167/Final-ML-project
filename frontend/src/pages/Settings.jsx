import { useState } from 'react'

export default function Settings() {
  const [activeSection, setActiveSection] = useState(null)

  const sections = [
    { id: 'general', title: 'General', description: 'Application preferences and language settings', icon: GeneralIcon },
    { id: 'appearance', title: 'Appearance', description: 'Customize the look and feel of the application', icon: AppearanceIcon },
    { id: 'models', title: 'Models', description: 'Default model parameters and storage paths', icon: ModelsIcon },
    { id: 'data', title: 'Data', description: 'Data processing and import preferences', icon: DataIcon },
    { id: 'export', title: 'Export', description: 'Configure export formats and destinations', icon: ExportIcon },
  ]

  if (activeSection) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Settings
        </button>

        {activeSection === 'general' && <GeneralPanel />}
        {activeSection === 'appearance' && <AppearancePanel />}
        {activeSection === 'models' && <ModelsPanel />}
        {activeSection === 'data' && <DataPanel />}
        {activeSection === 'export' && <ExportPanel />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div
          key={section.id}
          className={`bg-white rounded-2xl border border-border card-hover animate-fade-in-up stagger-${i + 1}`}
        >
          <button
            onClick={() => setActiveSection(section.id)}
            className="w-full p-5 md:p-6 flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-50 border border-border flex items-center justify-center shrink-0 group-hover:border-accent/30 group-hover:bg-accent/5 transition-all duration-200">
                <section.icon />
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy">{section.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 group-hover:text-accent transition-colors">Configure</span>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        </div>
      ))}
    </div>
  )
}

function GeneralPanel() {
  const [language, setLanguage] = useState('en')
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden animate-fade-in-up">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <GeneralIcon />
        <h3 className="text-sm font-bold text-navy">General Settings</h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-navy">Language</p>
            <p className="text-xs text-gray-400 mt-0.5">Application display language</p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-navy">Notifications</p>
            <p className="text-xs text-gray-400 mt-0.5">Show training completion notifications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
          </label>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-navy">Auto-save</p>
            <p className="text-xs text-gray-400 mt-0.5">Automatically save models after training</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
          </label>
        </div>
      </div>
    </div>
  )
}

function AppearancePanel() {
  const [theme, setTheme] = useState('light')
  const [compact, setCompact] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden animate-fade-in-up">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <AppearanceIcon />
        <h3 className="text-sm font-bold text-navy">Appearance Settings</h3>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-navy mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  theme === t
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-8 h-8 mx-auto mb-2 rounded-lg ${t === 'light' ? 'bg-white border border-border' : t === 'dark' ? 'bg-navy' : 'bg-gradient-to-br from-white to-navy border border-border'}`} />
                <p className="text-xs font-semibold text-navy capitalize">{t}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-navy">Compact Mode</p>
            <p className="text-xs text-gray-400 mt-0.5">Reduce spacing for denser layouts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={compact} onChange={() => setCompact(!compact)} className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
          </label>
        </div>
      </div>
    </div>
  )
}

function ModelsPanel() {
  const [storagePath, setStoragePath] = useState('results/models/')
  const [defaultTestSize, setDefaultTestSize] = useState(20)

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden animate-fade-in-up">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <ModelsIcon />
        <h3 className="text-sm font-bold text-navy">Model Settings</h3>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-navy mb-1.5">Default Storage Path</p>
          <p className="text-xs text-gray-400 mb-2">Directory where trained models are saved</p>
          <input
            type="text"
            value={storagePath}
            onChange={(e) => setStoragePath(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white font-mono"
          />
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-semibold text-navy mb-1.5">Default Train-Test Split</p>
          <p className="text-xs text-gray-400 mb-2">Default test size percentage for new training runs</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="40"
              value={defaultTestSize}
              onChange={(e) => setDefaultTestSize(Number(e.target.value))}
              className="flex-1 accent-accent h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
            />
            <span className="text-sm font-semibold text-navy w-12 text-right">{defaultTestSize}%</span>
          </div>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-semibold text-navy mb-1.5">Keep All Checkpoints</p>
          <p className="text-xs text-gray-400 mb-3">Save every model version instead of overwriting</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
          </label>
        </div>
      </div>
    </div>
  )
}

function DataPanel() {
  const [maxFileSize, setMaxFileSize] = useState('200')
  const [defaultEncoding, setDefaultEncoding] = useState('utf-8')

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden animate-fade-in-up">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <DataIcon />
        <h3 className="text-sm font-bold text-navy">Data Settings</h3>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-navy mb-1.5">Max Upload Size (MB)</p>
          <p className="text-xs text-gray-400 mb-2">Maximum file size allowed for uploads</p>
          <input
            type="number"
            value={maxFileSize}
            onChange={(e) => setMaxFileSize(e.target.value)}
            min="10"
            max="500"
            className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
          />
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-semibold text-navy mb-1.5">Default File Encoding</p>
          <p className="text-xs text-gray-400 mb-2">Character encoding used when reading CSV files</p>
          <select
            value={defaultEncoding}
            onChange={(e) => setDefaultEncoding(e.target.value)}
            className="px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
          >
            <option value="utf-8">UTF-8</option>
            <option value="latin-1">Latin-1</option>
            <option value="utf-16">UTF-16</option>
            <option value="iso-8859-1">ISO-8859-1</option>
          </select>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-semibold text-navy mb-1.5">Auto-detect Column Types</p>
          <p className="text-xs text-gray-400 mb-3">Automatically classify columns as numeric, categorical, etc.</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
          </label>
        </div>
      </div>
    </div>
  )
}

function ExportPanel() {
  const [format, setFormat] = useState('csv')
  const [includeCharts, setIncludeCharts] = useState(true)

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden animate-fade-in-up">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <ExportIcon />
        <h3 className="text-sm font-bold text-navy">Export Settings</h3>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-navy mb-1.5">Default Export Format</p>
          <p className="text-xs text-gray-400 mb-2">File format used when exporting prediction results</p>
          <div className="flex gap-2">
            {['csv', 'json', 'excel'].map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  format === f
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-border bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {f === 'excel' ? 'Excel' : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-navy">Include Charts</p>
            <p className="text-xs text-gray-400 mt-0.5">Embed visualization charts in exported reports</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={includeCharts} onChange={() => setIncludeCharts(!includeCharts)} className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
          </label>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-navy">Auto-export on Predict</p>
            <p className="text-xs text-gray-400 mt-0.5">Automatically export results after each prediction run</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
          </label>
        </div>
      </div>
    </div>
  )
}

function GeneralIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function AppearanceIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )
}

function ModelsIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

function DataIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
