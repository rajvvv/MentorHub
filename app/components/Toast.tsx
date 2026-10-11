'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type Kind = 'success' | 'error' | 'info'
type Toast = { id: number; kind: Kind; text: string }

type Ctx = { show: (text: string, kind?: Kind) => void }
const ToastCtx = createContext<Ctx>({ show: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((text: string, kind: Kind = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, kind, text }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const colors =
    toast.kind === 'success'
      ? 'bg-green-600 text-white'
      : toast.kind === 'error'
        ? 'bg-red-600 text-white'
        : 'bg-black text-white'

  return (
    <div
      className={`${colors} px-4 py-2 rounded shadow-lg text-sm max-w-sm pointer-events-auto transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {toast.text}
    </div>
  )
}
