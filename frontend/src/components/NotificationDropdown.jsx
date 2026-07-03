import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'

const typeStyles = {
  success: { bg: 'bg-green-50', dot: 'bg-green-500', border: 'border-green-200', text: 'text-green-700' },
  error: { bg: 'bg-red-50', dot: 'bg-red-500', border: 'border-red-200', text: 'text-red-700' },
  warning: { bg: 'bg-amber-50', dot: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700' },
  info: { bg: 'bg-blue-50', dot: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-700' },
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-error text-white text-[10px] font-bold rounded-full px-1 shadow-sm shadow-red-500/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-border shadow-xl shadow-black/5 overflow-hidden z-50 animate-scale-in origin-top-right">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-bold text-navy">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-accent hover:text-accent-dark transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 border border-border mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">Events will appear here as you use the platform</p>
              </div>
            ) : (
              notifications.map((n) => {
                const ts = typeStyles[n.type] || typeStyles.info
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`w-full text-left px-5 py-3.5 border-b border-border last:border-b-0 transition-colors hover:bg-gray-50/80 ${
                      !n.read ? 'bg-accent/[0.02]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-300' : ts.dot} ${!n.read ? 'animate-pulse-soft' : ''}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold ${n.read ? 'text-gray-500' : 'text-navy'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatTimeAgo(n.timestamp)}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 leading-relaxed ${n.read ? 'text-gray-400' : 'text-gray-600'}`}>
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
