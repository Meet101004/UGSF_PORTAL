import React, { useState } from 'react'
import { registerApi } from '../api/auth'

// Inline icons
const MailIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)
const UserIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const EyeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOffIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a20.79 20.79 0 0 1 5.06-5.94" />
    <path d="M1 1l22 22" />
    <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
  </svg>
)
const GraduationCapIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
)

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!name || !email || !password) return setError('All fields are required')
    if (password !== confirm) return setError('Passwords do not match')
    try {
      setLoading(true)
      await registerApi({ name, email, password }) // student by default
      setSuccess('Registration successful. Redirecting to login...')
      setTimeout(() => window.location.assign('/login'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-7xl flex items-center gap-10">
        {/* Left branding -> banner image (bigger) */}
        <div className="hidden lg:flex lg:w-7/12 xl:w-2/3 flex-col justify-center">
          <div className="rounded-3xl overflow-hidden shadow-xl border border-white bg-white">
            <img
              src="/leftside.png"
              alt="Institute banner"
              className="w-full h-[80vh] max-h-[900px] object-contain bg-white"
            />
          </div>
        </div>
        {/* Right form */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
            {/* Mobile banner (replaces small logo) */}
            <div className="lg:hidden flex justify-center mb-6">
              <img
                src="/charusat-banner.png"
                alt="Institute banner"
                className="w-56 rounded-xl shadow"
              />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-600">Sign up to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
                <div className="relative group">
                  <UserIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={e=>setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                <div className="relative group">
                  <MailIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Choose a password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={()=>setShowPassword(s=>!s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm password</label>
                <div className="relative group">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e=>setConfirm(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={()=>setShowConfirm(s=>!s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium">{error}</div>}
              {success && <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-xl text-sm font-medium">{success}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">Sign in</a>
              </p>
            </form>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">Terms</a> and{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}