import React, { useEffect, useState } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import AdminRegisterUser from '../../components/AdminRegisterUser'
import { getAdminStats, listAdminHods, listAdminProjects, createAdminProject, assignAdminProject, bulkProjectsExcel } from '../../api/admin'

// Inline icons (UI only)
const ChevronRight = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)
const ChevronDown = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)
const GraphIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 3v18h18" /><path d="M7 13l3 3 7-7" />
  </svg>
)
const UsersIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const FolderIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </svg>
)

// Collapsible card wrapper to “open only when click”
function AccordionSection({ icon, title, subtitle, open, onToggle, children }) {
  return (
    <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-3"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 text-left">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">{title}</div>
            {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
          </div>
        </div>
        <div className="text-slate-600">
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </section>
  )
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-md flex items-center gap-3">
      <div className="p-3 rounded-full bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <div className="text-sm">
        <div className="font-medium text-slate-700">{label}</div>
        <div className="text-lg font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  // role toggle for the Register section
  const [selectedRole, setSelectedRole] = useState('hod')

  // Which panel is open
  const [openPanel, setOpenPanel] = useState('stats')
  const openOnly = (id) => setOpenPanel(p => (p === id ? null : id))

  // Stats from backend
  const [stats, setStats] = useState({
    students: 0,
    applications: { total: 0, submitted: 0, accepted: 0, rejected: 0 }
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    let on = true
    ;(async () => {
      try {
        setStatsLoading(true)
        const data = await getAdminStats()
        if (on) setStats(data)
      } catch (e) {
        if (on) setStatsError(e.message || 'Failed to load stats')
      } finally {
        if (on) setStatsLoading(false)
      }
    })()
    return () => { on = false }
  }, [])

  // NEW: Projects state
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

  // Collapsible states
  const [openApps, setOpenApps] = useState(false)
  const [openRegister, setOpenRegister] = useState(false)
  const [openProjects, setOpenProjects] = useState(true)

  // Projects: UI-only filters and pagination
  const [pQuery, setPQuery] = useState('')
  const [pDept, setPDept] = useState('all')
  const [pPage, setPPage] = useState(1)
  const [pPageSize, setPPageSize] = useState(5)

  const depts = Array.from(new Set(projects.map(p => p.department).filter(Boolean)))
  const filteredProjects = projects.filter(p => {
    const okDept = pDept === 'all' || p.department === pDept
    const q = pQuery.trim().toLowerCase()
    const okQ = !q || [p.title, p.description, p.techStack, p.whatToDo, p.department]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    return okDept && okQ
  })
  const pTotalPages = Math.max(1, Math.ceil(filteredProjects.length / pPageSize))
  const safePage = Math.min(Math.max(1, pPage), pTotalPages)
  const pStart = (safePage - 1) * pPageSize
  const pageItems = filteredProjects.slice(pStart, pStart + pPageSize)

  useEffect(() => { setPPage(1) }, [pQuery, pDept, pPageSize])

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
      if (docFile) fd.append('docFile', docFile)
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm/6 opacity-90 hidden sm:block">{user?.name} ({user?.email})</span>
            <button onClick={logout} className="bg-white text-emerald-700 hover:bg-white/90 px-3 py-1.5 rounded-md font-medium">Logout</button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 space-y-6">
        {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded">{toast}</div>}

        {/* 1) Stats — first, visible by default. Other sections close it when opened */}
        <AccordionSection
          icon={<GraphIcon className="h-5 w-5" />}
          title="Overview"
          subtitle="Students and application status"
          open={openPanel === 'stats'}
          onToggle={() => openOnly('stats')}
        >
          {statsLoading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : statsError ? (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{statsError}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={<UsersIcon className="h-5 w-5" />} label="Total Students" value={stats.students} />
              <MetricCard icon={<FolderIcon className="h-5 w-5" />} label="Total Applications" value={stats.applications.total} />
              <MetricCard icon={<GraphIcon className="h-5 w-5" />} label="Accepted" value={stats.applications.accepted} />
              <MetricCard icon={<GraphIcon className="h-5 w-5" />} label="Rejected" value={stats.applications.rejected} />
            </div>
          )}
        </AccordionSection>

        {/* 2) Register HOD / Faculty */}
        <AccordionSection
          icon={<UsersIcon className="h-5 w-5" />}
          title="Register HOD / Faculty"
          subtitle="Create accounts for department heads and staff"
          open={openPanel === 'register'}
          onToggle={() => openOnly('register')}
        >
          <div className="inline-flex rounded-md overflow-hidden border bg-white">
            <button
              className={`px-4 py-2 ${selectedRole === 'hod' ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}
              onClick={() => setSelectedRole('hod')}
            >
              Register HOD
            </button>
            <button
              className={`px-4 py-2 ${selectedRole === 'faculty' ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}
              onClick={() => setSelectedRole('faculty')}
            >
              Register Faculty
            </button>
          </div>
          <div className="mt-4">
            <AdminRegisterUser forcedRole={selectedRole} />
          </div>
        </AccordionSection>

        {/* 3) Projects */}
        <AccordionSection
          icon={<FolderIcon className="h-5 w-5" />}
          title="Projects (Assign to HOD)"
          subtitle="Create projects, upload docs, and assign to HOD"
          open={openPanel === 'projects'}
          onToggle={() => openOnly('projects')}
        >
          {/* Quick filters */}
          <div className="mb-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  value={pQuery}
                  onChange={e => setPQuery(e.target.value)}
                  placeholder="Search by title, tech, description…"
                  className="pl-3 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
                />
              </div>
              <select
                value={pDept}
                onChange={e => setPDept(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Departments</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Per page</span>
              <select
                value={pPageSize}
                onChange={e => setPPageSize(Number(e.target.value))}
                className="px-2 py-1 border rounded-md bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {/* Create Project form (UI only) */}
          <form onSubmit={submitProject} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 border rounded-2xl p-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Project Name</label>
              <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                     value={projForm.title} onChange={e=>setProjForm(f=>({...f,title:e.target.value}))}
                     placeholder="e.g., UGSF Placement Portal" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Department</label>
              <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={projForm.department} onChange={e=>setProjForm(f=>({...f,department:e.target.value}))}>
                <option>IT</option><option>CE</option><option>EC</option><option>ME</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Assign HOD</label>
              <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={projForm.hodId} onChange={e=>setProjForm(f=>({...f,hodId:e.target.value}))}>
                <option value="">Select HOD</option>
                {hods.filter(h=>h.department===projForm.department).map(h=>(
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Description</label>
              <textarea className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        rows={3} value={projForm.description}
                        onChange={e=>setProjForm(f=>({...f,description:e.target.value}))}
                        placeholder="Brief overview of the project" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">What to do</label>
              <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                     value={projForm.whatToDo} onChange={e=>setProjForm(f=>({...f,whatToDo:e.target.value}))}
                     placeholder="Key tasks" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Tech Stack</label>
              <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                     value={projForm.techStack} onChange={e=>setProjForm(f=>({...f,techStack:e.target.value}))}
                     placeholder="e.g., React, Node, MongoDB" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Document Link</label>
              <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                     value={projForm.docLink} onChange={e=>setProjForm(f=>({...f,docLink:e.target.value}))}
                     placeholder="https://…" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Upload Document</label>
              <input type="file" onChange={e=>setDocFile(e.target.files?.[0]||null)}
                     className="w-full border rounded-lg px-3 py-2 bg-white" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button disabled={creating}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg">
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>

          {/* Projects list with pagination */}
          <div className="rounded-2xl border bg-white/80 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {filteredProjects.length} result{filteredProjects.length === 1 ? '' : 's'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  disabled={safePage <= 1}
                  onClick={() => setPPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span className="text-sm text-slate-500">
                  Page {safePage} of {pTotalPages}
                </span>
                <button
                  className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  disabled={safePage >= pTotalPages}
                  onClick={() => setPPage(p => Math.min(pTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-3 divide-y">
              {pageItems.length === 0 ? (
                <div className="py-6 text-sm text-slate-600">No projects match your filters.</div>
              ) : (
                pageItems.map(p => (
                  <div key={p._id} className="py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{p.title} <span className="text-xs text-slate-500">[{p.department}]</span></div>
                        <div className="text-sm text-slate-700 truncate">{p.description || '—'}</div>
                        {p.docLink && <a href={p.docLink} target="_blank" rel="noreferrer" className="text-emerald-700 underline text-sm">View Doc</a>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">HOD</span>
                        <select
                          value={p.assignedHod?._id || ''}
                          onChange={async (e) => {
                            const hid = e.target.value
                            try { await assignAdminProject(p._id, hid); setToast('HOD assigned') }
                            catch (err) { setToast(err.message) }
                          }}
                          className="border rounded px-2 py-1 bg-white"
                        >
                          <option value="">Unassigned</option>
                          {hods.filter(h=>h.department===p.department).map(h=>(
                            <option key={h._id} value={h._id}>{h.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bulk Excel (kept, styled) */}
          <form onSubmit={submitExcel} className="mt-4 rounded-2xl border bg-white/80 backdrop-blur-xl p-4 space-y-3">
            <div className="font-medium">Bulk Import via Excel</div>
            <div className="text-xs text-slate-500">
              Columns: Title, Description, WhatToDo, TechStack, DocUrl, Department. Optional HOD will be assigned to all.
            </div>
            <input type="file" accept=".xlsx" onChange={e=>setExcelFile(e.target.files?.[0]||null)} className="bg-white border rounded px-3 py-2" />
            <div>
              <label className="block text-sm text-slate-700 mb-1">Assign HOD (optional)</label>
              <select className="w-full border rounded px-2 py-1 bg-white" value={excelHodId} onChange={e=>setExcelHodId(e.target.value)}>
                <option value="">No default HOD</option>
                {hods.map(h=> <option value={h._id} key={h._id}>{h.name} - {h.department}</option>)}
              </select>
            </div>
            <button disabled={excelUploading} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg">
              {excelUploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </AccordionSection>
       </main>
     </div>
  )
}
 
function StatCard({ title, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  )
}