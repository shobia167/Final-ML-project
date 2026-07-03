import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'ml4u_notifications'

function loadNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(loadNotifications)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  const addNotification = useCallback(({ type, title, message, category }) => {
    const notification = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: type || 'info',
      title: title || '',
      message: message || '',
      category: category || 'system',
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [notification, ...prev])
    return notification
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
