"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { HardDrive, Lock, Shield } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Vault</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Your files,<br />
            securely stored.
          </h1>
          <p className="text-blue-100 text-lg mb-10">
            Powered entirely by Supabase. Secure, fast, and completely yours.
          </p>

          <div className="space-y-5">
            {[
              { icon: Shield, text: "End-to-end access control" },
              { icon: Lock, text: "Secure row-level security" },
              { icon: HardDrive, text: "Unlimited Supabase Storage" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-blue-50">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-200 text-xs">Self-hosted on Vercel & Supabase</p>
      </div>

      {/* Right panel — sign in */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            Welcome back
          </h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            Enter your credentials to access your vault.
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
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-150 shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Access Vault"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
