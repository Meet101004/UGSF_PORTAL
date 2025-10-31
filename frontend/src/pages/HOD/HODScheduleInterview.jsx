import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getHodApplication, listHodInterviews, scheduleInterview, updateInterview } from '../../api/hod'

// Inline icons (match dashboard style)
const CalendarIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>)
const VideoIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>)
const MapPinIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 10.61A8 8 0 1 0 3.16 10.6a8 8 0 0 0 17.68 0Z"/><circle cx="12" cy="10" r="3"/></svg>)

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

  const whenPreview = (() => {
    if (!form.date || !form.time) return '—'
    const d = new Date(`${form.date}T${form.time}:00`)
    return isNaN(d.getTime()) ? '—' : d.toLocaleString()
  })()

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Header + Back + Status */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-800 underline">Back</button>
          <div className="text-sm px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Accepted</div>
        </div>

        {/* Title */}
        <div className="text-lg font-semibold inline-flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" /> Schedule Interview
        </div>

        {/* Student summary */}
        {app && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
              {String(app.name || '?').trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-slate-800 font-medium truncate">{app.name}</div>
              <div className="text-sm text-slate-600 truncate">{app.email}</div>
            </div>
          </div>
        )}

        {/* Stepper (visual only) */}
        <div className="flex items-center justify-between text-sm text-slate-600">
          {[
            ['Pick date & time', true],
            ['Choose mode', true],
            ['Details', true],
            ['Notes', true],
            ['Review & save', true]
          ].map(([label], idx, arr) => (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">{idx+1}</div>
                <span className="hidden sm:block">{label}</span>
              </div>
              {idx < arr.length - 1 && <div className="mx-2 h-px bg-slate-200 flex-1" />}
            </div>
          ))}
        </div>

        {err && <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded text-sm">{err}</div>}

        {/* Form + Preview */}
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Left: Form */}
          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  min={todayYMD}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
                {!form.date && <div className="text-xs text-slate-500 mt-1">Pick any future date</div>}
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  min={form.date === todayYMD ? nowHM : undefined}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
                {!form.time && <div className="text-xs text-slate-500 mt-1">Local time, 24-hour format</div>}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Mode</label>
              <div className="inline-flex rounded-md border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: 'online' }))}
                  className={`px-3 py-1.5 text-sm inline-flex items-center gap-2 ${form.mode === 'online' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <VideoIcon className="h-4 w-4" /> Online
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: 'offline' }))}
                  className={`px-3 py-1.5 text-sm inline-flex items-center gap-2 border-l border-slate-200 ${form.mode === 'offline' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <MapPinIcon className="h-4 w-4" /> Offline
                </button>
              </div>
            </div>

            {form.mode === 'online' && (
              <div>
                <label className="block text-sm text-slate-700 mb-1">Meeting URL</label>
                <input
                  type="url"
                  value={form.meetingUrl}
                  onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="https://meeting.example.com/..."
                />
                <div className="text-xs text-slate-500 mt-1">Share a secured link. Must start with https://</div>
              </div>
            )}

            {form.mode === 'offline' && (
              <div>
                <label className="block text-sm text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Building • Room • Address"
                />
                <div className="text-xs text-slate-500 mt-1">Include building, room, and any entry instructions</div>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-700 mb-1">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Optional note for the student (e.g., bring ID card)"
              />
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="text-sm font-semibold text-slate-800 mb-2">Interview Preview</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">When</span>
                  <span className="text-slate-800">{whenPreview}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Mode</span>
                  <span className="inline-flex items-center gap-1 text-slate-800">
                    {form.mode === 'online' ? <VideoIcon className="h-4 w-4" /> : <MapPinIcon className="h-4 w-4" />}
                    {form.mode === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                {form.mode === 'online' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Link</span>
                    <span className="text-emerald-700 truncate max-w-[12rem]">{form.meetingUrl || '—'}</span>
                  </div>
                )}
                {form.mode === 'offline' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Venue</span>
                    <span className="text-slate-800 truncate max-w-[12rem]">{form.location || '—'}</span>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <span className="text-slate-600">Notes</span>
                  <span className="text-slate-800 max-w-[12rem]">{form.notes || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="md:col-span-5 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60">
              {saving ? 'Saving...' : (editingIv ? 'Update Interview' : 'Save Interview')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}