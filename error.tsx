'use client'
// src/app/error.tsx
import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚡</div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-slate-400 mb-2 text-sm">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-slate-600 text-xs font-mono mb-8">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">Try again</button>
          <a href="/" className="btn-secondary">Go home</a>
        </div>
      </div>
    </div>
  )
}
