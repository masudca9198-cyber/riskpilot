'use client'
// src/app/admin/layout.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const adminNav = [
  { href: '/admin', label: 'Overview', icon: '▦' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/transactions', label: 'Transactions', icon: '↕' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data || data.role !== 'ADMIN') { router.push('/dashboard'); return }
        setVerified(true)
      })
  }, [router])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!verified) return <div className="min-h-screen bg-surface-950 flex items-center justify-center text-slate-500">Loading…</div>

  return (
    <div className="min-h-screen bg-surface-950 flex">
      <aside className="w-60 bg-surface-900 border-r border-white/5 flex flex-col fixed inset-y-0 left-0">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">A</div>
          <div>
            <p className="font-display font-bold text-sm text-white">Admin Panel</p>
            <p className="text-xs text-slate-500">RiskPilot</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNav.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-red-600/15 text-red-400 border border-red-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-all mt-4">
            <span className="w-5 text-center">←</span>
            Back to Dashboard
          </Link>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={logout} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Sign out →</button>
        </div>
      </aside>
      <main className="flex-1 ml-60 p-6">{children}</main>
    </div>
  )
}
