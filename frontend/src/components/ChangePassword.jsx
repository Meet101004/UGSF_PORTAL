import React, { useState } from 'react'
import { changePasswordApi } from '../api/auth'
import { getRole, getMustChangePassword, setAuth, getAuth } from '../store/authStore'
import { getDashboardPath } from '../routes/paths'

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

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!oldPassword || !newPassword) return setError('Both old and new password are required')
    if (newPassword !== confirm) return setError('Passwords do not match')
    try {
      setLoading(true)
      await changePasswordApi({ oldPassword, newPassword })
      const auth = getAuth()
      setAuth({ ...auth, mustChangePassword: false })
      setSuccess('Password updated. Redirecting...')
      const role = getRole()
      setTimeout(() => window.location.assign(getDashboardPath(role)), 700)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const must = getMustChangePassword()
  const role = getRole()
  const showNotice = must && (role === 'hod' || role === 'faculty')

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Change Password</h1>
          {showNotice && <p className="text-gray-600">First login requires changing your password.</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Old password</label>
            <div className="relative group">
              <input
                type={showOld ? 'text' : 'password'}
                className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                value={oldPassword}
                onChange={e=>setOldPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={()=>setShowOld(s=>!s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="toggle old password visibility"
              >
                {showOld ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New password</label>
            <div className="relative group">
              <input
                type={showNew ? 'text' : 'password'}
                className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                value={newPassword}
                onChange={e=>setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={()=>setShowNew(s=>!s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="toggle new password visibility"
              >
                {showNew ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm new password</label>
            <div className="relative group">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                value={confirm}
                onChange={e=>setConfirm(e.target.value)}
                required
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
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}