import React, { useEffect, useState } from 'react'
import { createMyApplication, uploadApplicationDocument, getMyApplication, updateMyApplication } from '../../api/applications'
import { useNavigate } from 'react-router-dom'

const DEPARTMENTS = ['IT', 'CE', 'CSE', 'ME', 'CIVIL', 'EE', 'EC', 'AIML']
const API_BASE = import.meta.env.VITE_API_URL || ''
const abs = (url) => (!url ? '' : /^https?:\/\//i.test(url) ? url : `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`)

export default function ApplicationForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    fatherName: '',
    cgpa: '',
    fatherIncome: '',
    department: ''
  })
  const [files, setFiles] = useState({
    aadharCard: null,
    incomeCertificate: null,
    resume: null,
    resultsheet: null
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState(null) // {exists,status,canUploadDocuments,missingDocuments}

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }
  function onFileChange(e) {
    const { name, files: f } = e.target
    setFiles((prev) => ({ ...prev, [name]: f?.[0] || null }))
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const d = await getMyApplication()
        if (mounted) {
          setExisting(d)
          // Prefill form with previously submitted data (read-only in pending)
          if (d?.exists) {
            setForm(f => ({
              ...f,
              name: d.name || f.name,
              email: d.email || f.email,
              fatherName: d.fatherName || f.fatherName,
              cgpa: d.cgpa !== undefined && d.cgpa !== null ? String(d.cgpa) : f.cgpa,
              fatherIncome: d.fatherIncome !== undefined && d.fatherIncome !== null ? String(d.fatherIncome) : f.fatherIncome,
              department: d.department || f.department
            }))
          }
        }
      } catch (_) {}
    })()
    return () => { mounted = false }
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (existing?.exists) {
      if (existing.status === 'rejected') {
        return setError('Your application was rejected. You cannot submit a new one.')
      }
      if (existing.status === 'submitted') {
        try {
          setLoading(true)
          // If HOD-marked pending, update fields first
          if (canEditInPending) {
            await updateMyApplication({
              name: form.name,
              email: form.email,
              fatherName: form.fatherName,
              cgpa: form.cgpa ? Number(form.cgpa) : undefined,
              fatherIncome: form.fatherIncome ? Number(form.fatherIncome) : undefined,
              department: form.department
            })
          }
          const appId = existing.id
          const uploads = []
          for (const [key, file] of Object.entries(files)) {
            if (file) uploads.push(uploadApplicationDocument(appId, key, file))
          }
          if (uploads.length) await Promise.all(uploads)
          setSuccess(canEditInPending ? 'Application updated.' : 'Documents uploaded.')
          setTimeout(() => navigate('/student/status'), 800)
        } catch (e2) {
          setError(e2.message)
        } finally {
          setLoading(false)
        }
        return
      }
      // Accepted -> nothing to do here
      return setError('Your application is already processed.')
    }

    // No application yet -> create then upload
    if (!form.name || !form.email || !form.fatherName || !form.department) {
      return setError('Name, Email, Father Name and Department are required')
    }
    try {
      setLoading(true)
      const created = await createMyApplication({
        name: form.name,
        email: form.email,
        fatherName: form.fatherName,
        cgpa: form.cgpa ? Number(form.cgpa) : undefined,
        fatherIncome: form.fatherIncome ? Number(form.fatherIncome) : undefined,
        department: form.department
      })
      const appId = created?.id
      const uploads = []
      for (const [key, file] of Object.entries(files)) {
        if (file) uploads.push(uploadApplicationDocument(appId, key, file))
      }
      if (uploads.length) await Promise.all(uploads)
      setSuccess('Application submitted.')
      setTimeout(() => navigate('/student/status'), 800)
    } catch (e2) {
      setError(e2.message)
    } finally {
      setLoading(false)
    }
  }

  const pendingMode = existing?.exists && existing.status === 'submitted'
  const rejectedMode = existing?.exists && existing.status === 'rejected'
  const canEditInPending = pendingMode && !!existing?.hodMarkedPending
  const docs = existing?.documents || {}
  const DOCS_LIST = [
    ['Aadhar Card', 'aadharCard'],
    ['Income Certificate', 'incomeCertificate'],
    ['Resume', 'resume'],
    ['Result Sheet', 'resultsheet']
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">
            {pendingMode ? 'Upload Documents (Pending)' : 'Submit Application'}
          </h1>
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-800 underline">
            Back
          </button>
        </div>

        {pendingMode && (
          <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
            Your application is pending. Please upload required documents. You can also view what you already uploaded below.
            {Array.isArray(existing?.missingDocuments) && existing.missingDocuments.length > 0 && (
              <div className="mt-1 text-amber-700">
                Missing: {existing.missingDocuments.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Current documents (show what is already uploaded) */}
        {(pendingMode || existing?.exists) && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Current Documents</h2>
            <ul className="space-y-2">
              {DOCS_LIST.map(([label, key]) => {
                const d = docs[key]
                const url = abs(d?.url)
                const isImg = (d?.mimetype || '').startsWith('image/')
                return (
                  <li key={key} className="flex items-center justify-between border rounded px-3 py-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {url && isImg ? (
                        <img src={url} alt={label} className="h-10 w-10 rounded object-cover border" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 text-xs">DOC</div>
                      )}
                      <div className="min-w-0">
                        <div className="text-slate-800 text-sm truncate">{label}</div>
                        <div className="text-slate-500 text-xs truncate">{d?.filename || (url ? 'Uploaded' : 'Not uploaded')}</div>
                      </div>
                    </div>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-900 underline text-sm">
                        View
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm">Not uploaded</span>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-slate-500 mt-2">Selecting a file below will replace the existing one on upload.</p>
          </div>
        )}

        {rejectedMode && (
          <div className="mb-4 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded p-3">
            Your application was rejected. You cannot submit a new application.
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Disable basic fields in pending mode */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input name="name" className="w-full border rounded-lg px-3 py-2"
              value={form.name} onChange={onChange} required disabled={(!canEditInPending && pendingMode) || rejectedMode} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" className="w-full border rounded-lg px-3 py-2"
              value={form.email} onChange={onChange} required disabled={(!canEditInPending && pendingMode) || rejectedMode} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Father Name</label>
            <input name="fatherName" className="w-full border rounded-lg px-3 py-2"
              value={form.fatherName} onChange={onChange} required disabled={(!canEditInPending && pendingMode) || rejectedMode} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CGPA</label>
            <input name="cgpa" type="number" step="0.01" min="0" max="10" className="w-full border rounded-lg px-3 py-2"
              value={form.cgpa} onChange={onChange} disabled={(!canEditInPending && pendingMode) || rejectedMode} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Father Income</label>
            <input name="fatherIncome" type="number" min="0" className="w-full border rounded-lg px-3 py-2"
              value={form.fatherIncome} onChange={onChange} disabled={(!canEditInPending && pendingMode) || rejectedMode} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Department</label>
            <select name="department" className="w-full border rounded-lg px-3 py-2"
              value={form.department} onChange={onChange} required disabled={(!canEditInPending && pendingMode) || rejectedMode}>
              <option value="" disabled>Select your department</option>
              {DEPARTMENTS.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          {/* Documents (replacement allowed). Keep enabled in pending mode */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Aadhar Card (PDF/Image)</label>
              <input type="file" name="aadharCard" accept=".pdf,image/*" onChange={onFileChange} className="w-full" disabled={rejectedMode} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Income Certificate (PDF/Image)</label>
              <input type="file" name="incomeCertificate" accept=".pdf,image/*" onChange={onFileChange} className="w-full" disabled={rejectedMode} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resume (PDF)</label>
              <input type="file" name="resume" accept=".pdf" onChange={onFileChange} className="w-full" disabled={rejectedMode} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Result Sheet (PDF/Image)</label>
              <input type="file" name="resultsheet" accept=".pdf,image/*" onChange={onFileChange} className="w-full" disabled={rejectedMode} />
            </div>
          </div>

          {error && <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
          {success && <div className="md:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>}

          <div className="md:col-span-2">
            <button disabled={loading || rejectedMode}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-60">
              {pendingMode ? (loading ? 'Uploading...' : 'Upload Documents') : (loading ? 'Submitting...' : 'Submit Application')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}