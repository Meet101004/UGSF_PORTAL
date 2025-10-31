import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getHodApplication, listHodInterviews, scheduleInterview, updateInterview } from '../../api/hod'

export default function HODScheduleInterview() {
  const { id } = useParams() // applicationId
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [app, setApp] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: '', time: '', mode: 'online', meetingUrl: '', location: '', notes: '' })
  const [editingIv, setEditingIv] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setErr('')
        const a = await getHodApplication(id)
        if (!mounted) return
        setApp(a)
        if (a?.status !== 'accepted') {
          setErr('Interview can be scheduled only after acceptance.')
          return
        }
        const rows = await listHodInterviews({ student: a.student })
        if (!mounted) return
        const last = (rows || []).slice(-1)[0]
        // prefer pending interview for editing
        const pending = (rows || []).filter(r => r.result === 'pending')
          .sort((x,y) => new Date(y.scheduledAt) - new Date(x.scheduledAt))[0] || null
        setEditingIv(pending || null)

        const base = pending || last
        if (base) {
          const dt = new Date(base.scheduledAt)
          setForm({
            date: dt.toISOString().slice(0,10),
            time: dt.toTimeString().slice(0,5),
            mode: base.mode,
            meetingUrl: base.meetingUrl || '',
            location: base.location || '',
            notes: base.notes || ''
          })
        }
      } catch (e) {
        if (mounted) setErr(e.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  function combineISO(d, t) {
    if (!d || !t) return null
    return new Date(`${d}T${t}:00`)
  }

  async function submit(e) {
    e.preventDefault()
    setErr('')
    const when = combineISO(form.date, form.time)
    if (!when) return setErr('Select date and time')
    if (when.getTime() <= Date.now()) return setErr('Selected time must be in the future')
    if (form.mode === 'online' && !/^https?:\/\//i.test(form.meetingUrl || '')) return setErr('Enter a valid meeting link (https://...)')
    if (form.mode === 'offline' && !form.location.trim()) return setErr('Enter a venue for offline interview')

    const payload = {
      applicationId: id,
      scheduledAt: when.toISOString(),
      mode: form.mode,
      meetingUrl: form.mode === 'online' ? form.meetingUrl : undefined,
      location: form.mode === 'offline' ? form.location : undefined,
      notes: form.notes || undefined
    }

    try {
      setSaving(true)
      if (editingIv && editingIv.result === 'pending') {
        await updateInterview(editingIv._id, payload)
      } else {
        await scheduleInterview(payload)
      }
      console.log('Scheduled interview')
      // Prefer going back to preserve auth context; fallback to /hod
      if (window.history.length > 1) navigate(-1)
      else navigate('/hod', { replace: true })
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setSaving(false)
    }
  }

  // Helpers to format local date/time for input[min]
  const toLocalYMD = (d = new Date()) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const todayYMD = toLocalYMD()
  const nowHM = (() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  })()

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-800 underline">Back</button>
          <div className="text-sm px-2 py-1 rounded bg-emerald-50 text-emerald-700">Accepted</div>
        </div>
        <h1 className="text-lg font-semibold">Schedule Interview</h1>
        {app && (
          <div className="text-sm text-slate-700">
            {app.name} ({app.email})
          </div>
        )}
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                min={todayYMD}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                // if scheduling for today, disallow past times
                min={form.date === todayYMD ? nowHM : undefined}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Mode</label>
            <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          {form.mode === 'online' && (
            <div>
              <label className="block text-sm text-slate-700 mb-1">Meeting URL</label>
              <input type="url" value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm" placeholder="https://..."
              />
            </div>
          )}
          {form.mode === 'offline' && (
            <div>
              <label className="block text-sm text-slate-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Venue"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-700 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white">
              {saving ? 'Saving...' : 'Save Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}