import React, { useEffect, useState } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import AdminRegisterUser from '../../components/AdminRegisterUser'
import { listAdminHods, listAdminProjects, createAdminProject, assignAdminProject, bulkProjectsExcel, getAdminStats } from '../../api/admin'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  const [selectedRole, setSelectedRole] = useState('hod')
  const [stats, setStats] = useState({ students: 0, applications: { total: 0, submitted: 0, accepted: 0, rejected: 0 } })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  const [hods, setHods] = useState([])
  const [projects, setProjects] = useState([])
  const [projForm, setProjForm] = useState({
    title: '', description: '', whatToDo: '', techStack: '', department: 'IT', hodId: '', docLink: ''
  })
  const [docFile, setDocFile] = useState(null)
  const [creating, setCreating] = useState(false)
  const [excelFile, setExcelFile] = useState(null)
  const [excelHodId, setExcelHodId] = useState('')
  const [toast, setToast] = useState('')
  const [excelUploading, setExcelUploading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [hs, ps] = await Promise.all([listAdminHods(), listAdminProjects()])
        if (!mounted) return
        setHods(hs); setProjects(ps)
      } catch {}
    })()
    return () => { mounted = false }
  }, [toast])

  // Load live stats
  useEffect(() => {
    let mounted = true
    setStatsLoading(true); setStatsError('')
    getAdminStats()
      .then(d => { if (mounted) setStats(d) })
      .catch(e => { if (mounted) setStatsError(e.message || 'Failed to load stats') })
      .finally(() => { if (mounted) setStatsLoading(false) })
    return () => { mounted = false }
  }, [])

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  async function submitProject(e) {
    e.preventDefault()
    setCreating(true)
    try {
      const fd = new FormData()
      Object.entries(projForm).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (docFile) fd.append('docFile', docFile) // stored in Mongo (GridFS)
      await createAdminProject(fd)
      setToast('Project created')
      setProjForm({ title: '', description: '', whatToDo: '', techStack: '', department: 'IT', hodId: '', docLink: '' })
      setDocFile(null)
      const ps = await listAdminProjects()
      setProjects(ps)
    } catch (e) {
      setToast(e.message)
    } finally {
      setCreating(false)
      setTimeout(() => setToast(''), 1500)
    }
  }

  async function submitExcel(e) {
    e.preventDefault()
    if (!excelFile) return setToast('Select an Excel file (.xlsx)')
    try {
      setExcelUploading(true)
      const res = await bulkProjectsExcel(excelFile, excelHodId || undefined)
      setToast(`Excel imported (${res.created})`)
      setExcelFile(null); setExcelHodId('')
      const ps = await listAdminProjects(); setProjects(ps)
    } catch (e) {
      alert(e.message)
      setToast(e.message)
    } finally {
      setExcelUploading(false)
      setTimeout(() => setToast(''), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
            <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-6xl mx-auto">
        {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded">{toast}</div>}

        {/* Applications Overview (live, consistent UI) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Applications Overview</h2>
            <span className="text-xs text-slate-500">Live from backend</span>
          </div>
          {statsError && <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{statsError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total" value={stats.applications.total} color="indigo" />
            <StatCard title="Submitted" value={stats.applications.submitted} color="sky" />
            <StatCard title="Accepted" value={stats.applications.accepted} color="emerald" />
            <StatCard title="Rejected" value={stats.applications.rejected} color="rose" />
          </div>
          <div className="mt-2">
            {statsLoading ? (
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-1/3 bg-emerald-300 animate-pulse" />
              </div>
            ) : (
              <ProgressBar accepted={stats.applications.accepted} rejected={stats.applications.rejected} submitted={stats.applications.submitted} />
            )}
            <div className="text-xs text-slate-500 mt-1">
              Students registered: <span className="font-medium text-slate-700">{stats.students}</span>
            </div>
          </div>
        </section>

        {/* Register HOD/Faculty (styled) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Register HOD / Faculty</h2>
            <div className="inline-flex rounded-md overflow-hidden border">
              <button className={`px-4 py-2 ${selectedRole === 'hod' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`} onClick={() => setSelectedRole('hod')}>Register HOD</button>
              <button className={`px-4 py-2 ${selectedRole === 'faculty' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`} onClick={() => setSelectedRole('faculty')}>Register Faculty</button>
            </div>
          </div>
          <AdminRegisterUser forcedRole={selectedRole} />
        </section>

        {/* Projects (Assign to HOD) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-medium">Projects (Assign to HOD)</h2>

          <form onSubmit={submitProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Project Name</label>
              <input className="w-full border rounded-lg px-3 py-2" value={projForm.title}
                     onChange={e=>setProjForm(f=>({...f,title:e.target.value}))} placeholder="e.g., UGSF Placement Portal" />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Department</label>
              <select className="w-full border rounded-lg px-3 py-2" value={projForm.department}
                      onChange={e=>setProjForm(f=>({...f,department:e.target.value, hodId: ''}))}>
                {['IT','CE','CSE','ME','CIVIL','EE','EC','AIML'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Assign HOD (optional)</label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                value={projForm.hodId}
                onChange={e=>setProjForm(f=>({...f,hodId:e.target.value}))}
              >
                <option value="">Select HOD (optional)</option>
                {hods.map(h => (
                  <option key={h._id} value={h._id}>{h.name} {h.department ? `(${h.department})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Description</label>
              <textarea rows={2} className="w-full border rounded-lg px-3 py-2"
                        value={projForm.description} onChange={e=>setProjForm(f=>({...f,description:e.target.value}))}/>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">What to do</label>
              <textarea rows={2} className="w-full border rounded-lg px-3 py-2"
                        value={projForm.whatToDo} onChange={e=>setProjForm(f=>({...f,whatToDo:e.target.value}))}/>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Tech Stack</label>
              <input className="w-full border rounded-lg px-3 py-2" value={projForm.techStack}
                     onChange={e=>setProjForm(f=>({...f,techStack:e.target.value}))} placeholder="React, Node, MongoDB" />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Doc Link (Drive/URL)</label>
              <input className="w-full border rounded-lg px-3 py-2" value={projForm.docLink}
                     onChange={e=>setProjForm(f=>({...f,docLink:e.target.value}))} placeholder="https://drive.google.com/..." />
              <div className="text-xs text-slate-500 mt-1">Make sure “Anyone with the link can view”.</div>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Or Upload Doc (PDF/Image)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={e=>setDocFile(e.target.files?.[0]||null)} />
              <div className="text-xs text-slate-500 mt-1">Stored in MongoDB (GridFS). Max 5MB.</div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button disabled={creating} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg">
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="px-4 py-3 bg-slate-50 font-medium text-slate-800">Existing Projects</div>
              <div className="max-h-80 overflow-auto divide-y">
                {projects.length === 0 ? (
                  <div className="p-4 text-slate-500 text-sm">No projects</div>
                ) : projects.map(p => (
                  <div key={p._id} className="p-4 space-y-1">
                    <div className="font-medium">{p.title} <span className="text-xs text-slate-500">[{p.department}]</span></div>
                    <div className="text-sm text-slate-700">{p.description || '—'}</div>
                    {p.docLink && <a href={p.docLink} target="_blank" rel="noreferrer" className="text-emerald-700 underline text-sm">View Doc</a>}
                    <div className="flex items-center gap-2 text-sm">
                      <span>HOD:</span>
                      <select
                        value={p.assignedHod?._id || ''}
                        onChange={async (e) => {
                          const hid = e.target.value
                          try { await assignAdminProject(p._id, hid); setToast('HOD assigned (department updated)') }
                          catch (err) { setToast(err.message) }
                        }}
                        className="border rounded px-2 py-1 bg-white"
                      >
                        <option value="">Unassigned</option>
                        {hods.map(h=>(
                          <option key={h._id} value={h._id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={submitExcel} className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white shadow-sm">
              <div className="font-medium">Bulk Import via Excel</div>
              <div className="text-xs text-slate-500">
                Columns: Title, Description, WhatToDo, TechStack, DocUrl, Department. Optional HOD will be assigned to all.
              </div>
              <input type="file" accept=".xlsx" onChange={e=>setExcelFile(e.target.files?.[0]||null)} />
              <div>
                <label className="block text-sm text-slate-700 mb-1">Assign HOD (optional)</label>
                <select className="w-full border rounded px-2 py-1" value={excelHodId} onChange={e=>setExcelHodId(e.target.value)}>
                  <option value="">No default HOD</option>
                  {hods.map(h=> <option value={h._id} key={h._id}>{h.name} - {h.department}</option>)}
                </select>
              </div>
              <button disabled={excelUploading} className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg">
                {excelUploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>

          <p className="text-xs text-slate-500">
            Tip: Use a Google Drive link with “Anyone with the link can view”, or upload a PDF/image which is stored in MongoDB and served at /files/:id.
          </p>
        </section>
      </main>
    </div>
  )
}

function StatCard({ title, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-3xl font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  )
}

function ProgressBar({ accepted = 0, rejected = 0, submitted = 0 }) {
  const total = accepted + rejected + submitted
  const a = total ? Math.round((accepted / total) * 100) : 0
  const r = total ? Math.round((rejected / total) * 100) : 0
  const s = Math.max(0, 100 - a - r)
  return (
    <div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden flex">
        <div className="h-full bg-emerald-500" style={{ width: `${a}%` }} title={`Accepted ${a}%`} />
        <div className="h-full bg-rose-500" style={{ width: `${r}%` }} title={`Rejected ${r}%`} />
        <div className="h-full bg-sky-400" style={{ width: `${s}%` }} title={`Submitted ${s}%`} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>Accepted: {accepted}</span>
        <span>Rejected: {rejected}</span>
        <span>Submitted: {submitted}</span>
      </div>
    </div>
  )
}