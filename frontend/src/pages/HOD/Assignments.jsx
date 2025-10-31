import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAssignmentOptions, createAssignment, listAssignments } from '../../api/hod'

export default function HODAssignments() {
  const navigate = useNavigate()
  const [opts, setOpts] = useState({ students: [], faculties: [], projects: [] })
  const [form, setForm] = useState({ studentId: '', facultyId: '', projectId: '', projectTitle: '', projectDesc: '', startDate: '', endDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [assignments, setAssignments] = useState([])

  async function load() {
    setError('')
    try {
      const [o, a] = await Promise.all([getAssignmentOptions(), listAssignments({ status: 'active' })])
      setOpts(o); setAssignments(a)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.studentId || !form.facultyId || (!form.projectId && !form.projectTitle.trim())) {
      return setError('Select student, faculty and project')
    }
    try {
      setSaving(true)
      await createAssignment({
        studentId: form.studentId,
        facultyId: form.facultyId,
        projectId: form.projectId || undefined,
        projectTitle: form.projectId ? undefined : form.projectTitle.trim(),
        projectDesc: form.projectId ? undefined : (form.projectDesc || '').trim(),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined
      })
      // Refresh options and active list (new ones should disappear from selects)
      setForm({ studentId: '', facultyId: '', projectId: '', projectTitle: '', projectDesc: '', startDate: '', endDate: '' })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Assignments</h1>
        <button className="text-slate-600 underline" onClick={() => navigate('/hod')}>Back to Dashboard</button>
      </div>

      {error && <div className="mb-3 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Student</label>
            <select className="w-full border rounded px-2 py-2" value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
              <option value="">Select student</option>
              {opts.students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Faculty</label>
            <select className="w-full border rounded px-2 py-2" value={form.facultyId}
              onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
              <option value="">Select faculty</option>
              {opts.faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Project</label>
            <select className="w-full border rounded px-2 py-2" value={form.projectId}
              onChange={e => setForm(f => ({ ...f, projectId: e.target.value, projectTitle: '', projectDesc: '' }))}>
              <option value="">Select existing project</option>
              {opts.projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
            <div className="text-xs text-slate-500 mt-1">Or enter a custom project below</div>
          </div>
        </div>

        {/* Custom project (when no projectId) */}
        {!form.projectId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Custom Project Title</label>
              <input className="w-full border rounded px-2 py-2" value={form.projectTitle}
                onChange={e => setForm(f => ({ ...f, projectTitle: e.target.value }))} placeholder="Project title" />
            </div>
            <div>
              <label className="block text-sm mb-1">Description (optional)</label>
              <textarea rows={2} className="w-full border rounded px-2 py-2" value={form.projectDesc}
                onChange={e => setForm(f => ({ ...f, projectDesc: e.target.value }))} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Start Date</label>
            <input type="datetime-local" className="w-full border rounded px-2 py-2" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">End Date</label>
            <input type="datetime-local" className="w-full border rounded px-2 py-2" value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end">
          <button disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2 rounded">
            {saving ? 'Assigning...' : 'Create Assignment'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow mt-6 overflow-x-auto">
        <div className="px-4 py-3 border-b text-slate-800 font-semibold">Active Assignments</div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Student</th>
              <th className="text-left px-4 py-2">Faculty</th>
              <th className="text-left px-4 py-2">Project</th>
              <th className="text-left px-4 py-2">Period</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr><td className="px-4 py-3" colSpan={4}>No active assignments</td></tr>
            ) : assignments.map(a => (
              <tr key={a._id} className="border-t">
                <td className="px-4 py-2">{a.student?.name} ({a.student?.email})</td>
                <td className="px-4 py-2">{a.faculty?.name} ({a.faculty?.email})</td>
                <td className="px-4 py-2">{a.projectTitle}</td>
                <td className="px-4 py-2">
                  {a.startDate ? new Date(a.startDate).toLocaleDateString() : '—'} - {a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}