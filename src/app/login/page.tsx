"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

export default function LoginPage() {
  const [showForm, setShowForm] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret combo: Ctrl + Shift + L
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        setShowForm((prev) => !prev)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSecretTap = () => {
    const newCount = tapCount + 1
    setTapCount(newCount)
    if (newCount >= 5) {
      setShowForm(true)
      setTapCount(0) // reset
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  // If the secret combo hasn't been pressed, show a fake 404 page!
  if (!showForm) {
    return (
      <div style={{ fontFamily: "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'", height: "100vh", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} className="bg-white text-black dark:bg-black dark:text-white">
        <div style={{ lineHeight: "48px" }}>
          <h1 
            onClick={handleSecretTap}
            className="cursor-default select-none"
            style={{ display: "inline-block", margin: "0 20px 0 0", paddingRight: "23px", fontSize: "24px", fontWeight: 500, verticalAlign: "top", borderRight: "1px solid rgba(150, 150, 150, 0.3)" }}
          >
            404
          </h1>
          <div style={{ display: "inline-block", textAlign: "left" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 400, lineHeight: "28px", margin: 0 }}>
              This page could not be found.
            </h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      {/* Left panel — clean professional look */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0f1117 100%)" }}
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Top badge */}
        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/10 border border-white/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <span className="text-white/60 text-sm tracking-widest uppercase font-medium">Secure Portal</span>
        </div>

        {/* Center content */}
        <div className="relative">
          <p className="text-white/30 text-xs tracking-widest uppercase mb-6 font-medium">
            Private Document System
          </p>
          <h1 className="text-5xl font-light text-white leading-tight mb-6 tracking-tight">
            Authorised<br />
            <span className="font-semibold">Access Only.</span>
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-sm">
            This system is restricted to authorised personnel. All access is monitored and logged. Unauthorised access is strictly prohibited.
          </p>

          <div className="mt-10 flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              System Operational
            </div>
            <div className="text-white/20 text-xs">|</div>
            <div className="text-white/30 text-xs">256-bit Encrypted</div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} — Private & Confidential
          </p>
        </div>
      </div>

      {/* Right panel — sign in */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--color-surface)]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-7 h-7 rounded bg-white/10 border border-white/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-text-muted)]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <span className="text-sm text-[var(--color-text-muted)] tracking-widest uppercase">Secure Portal</span>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] tracking-widest uppercase mb-2 font-medium">Authentication</p>
          <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-1">Sign in</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-8">
            Enter your credentials to continue.
          </p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500"
                placeholder="Enter password"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-medium transition-all duration-150 shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
