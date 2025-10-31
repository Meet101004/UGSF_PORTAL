import React, { useEffect, useState } from 'react'
import { adminCreateUser } from '../api/admin'

const DEPARTMENTS = ['IT', 'CE', 'CSE', 'ME', 'CIVIL', 'EE', 'EC', 'AIML']

export default function AdminRegisterUser({ forcedRole }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(forcedRole || 'hod')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('') // optional; backend defaults to 'changeme'
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (forcedRole) setRole(forcedRole)
  }, [forcedRole])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !email) return setError('Name and email are required')
    if (!['hod', 'faculty'].includes(role)) return setError('Invalid role')
    if (!department) return setError('Department is required')

    try {
      setLoading(true)
      const resp = await adminCreateUser({ name, email, role, password, department })
      setSuccess(`Created ${role.toUpperCase()} (${resp?.id}). First login requires password change.`)
      setName(''); setEmail(''); setPassword(''); setDepartment('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Registering as</label>
        <div className="inline-flex gap-2">
          <span className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700">
            {role === 'hod' ? 'HOD' : 'Faculty'}
          </span>
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Full name</label>
        <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" className="w-full border rounded-lg px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Department</label>
        <select
          className="w-full border rounded-lg px-3 py-2"
          value={department}
          onChange={e => setDepartment(e.target.value)}
          required
        >
          <option value="" disabled>Select Department</option>
          {DEPARTMENTS.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Initial password (optional)</label>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Leave blank to use email prefix (before @)" value={password} onChange={e=>setPassword(e.target.value)} />
        <p className="text-xs text-slate-500 mt-1">They must change password on first login.</p>
      </div>

      {error && <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
      {success && <div className="md:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>}

      <div className="md:col-span-2">
        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-60">
          {loading ? 'Creating...' : `Create ${role === 'hod' ? 'HOD' : 'Faculty'}`}
        </button>
      </div>
    </form>
  )
}