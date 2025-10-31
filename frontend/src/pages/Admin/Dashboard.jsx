import React, { useEffect, useState, useMemo } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import AdminRegisterUser from '../../components/AdminRegisterUser'
import { listAdminHods, listAdminProjects, createAdminProject, assignAdminProject, bulkProjectsExcel, getAdminStats } from '../../api/admin'

// Inline icons (no deps)
const ChartIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/></svg>)
const UsersIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>)
const FolderIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>)
const UploadIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5"/><path d="M12 15V5"/></svg>)

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

  // UI-only: Projects pagination
  const [projPage, setProjPage] = useState(1)
  const [projPageSize, setProjPageSize] = useState(5)
  const totalProjects = projects.length
  const projPages = Math.max(1, Math.ceil(totalProjects / projPageSize))
  const projStart = (projPage - 1) * projPageSize
  const projEnd = Math.min(totalProjects, projStart + projPageSize)
  const pageProjects = useMemo(() => projects.slice(projStart, projStart + projPageSize), [projects, projStart, projPageSize])
  useEffect(() => { if (projPage > projPages) setProjPage(projPages) }, [projPages, projPage])

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
      {/* Primary header */}
      <header className="bg-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
            <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
          </div>
        </div>
      </header>

      {/* Section nav (UI only) */}
      <div className="bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-6">
          <SectionNav items={[
            { id: 'apps', label: 'Applications' },
            { id: 'users', label: 'Users' },
            { id: 'projects', label: 'Projects' },
            { id: 'import', label: 'Bulk Import' }
          ]} />
        </div>
      </div>

      <main className="p-6 space-y-6 max-w-6xl mx-auto">
        {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded">{toast}</div>}

        {/* Applications Overview (open by default) */}
        <CollapsibleSection id="apps" title="Applications Overview" icon={<ChartIcon className="h-5 w-5" />} defaultOpen>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Live from backend</span>
          </div>
          {statsError && <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{statsError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total" value={stats.applications.total} color="emerald" />
            <StatCard title="Submitted" value={stats.applications.submitted} color="emerald" />
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
        </CollapsibleSection>

        {/* Register HOD/Faculty (collapsed initially) */}
        <CollapsibleSection id="users" title="Register HOD / Faculty" icon={<UsersIcon className="h-5 w-5" />}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Choose role</div>
            <div className="inline-flex rounded-md overflow-hidden border">
              <button className={`px-4 py-2 ${selectedRole === 'hod' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`} onClick={() => setSelectedRole('hod')}>Register HOD</button>
              <button className={`px-4 py-2 ${selectedRole === 'faculty' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`} onClick={() => setSelectedRole('faculty')}>Register Faculty</button>
            </div>
          </div>
          <AdminRegisterUser forcedRole={selectedRole} />
        </CollapsibleSection>

        {/* Projects (Assign to HOD) - collapsed initially with pagination */}
        <CollapsibleSection id="projects" title="Projects (Assign to HOD)" icon={<FolderIcon className="h-5 w-5" />}>
          {/* Create project */}
          <form onSubmit={submitProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Project Name</label>
              <input className="w-full border rounded-lg px-3 py-2" value={projForm.title}
                onChange={e => setProjForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., UGSF Placement Portal" />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Department</label>
              <select className="w-full border rounded-lg px-3 py-2" value={projForm.department}
                onChange={e => setProjForm(f => ({ ...f, department: e.target.value, hodId: '' }))}>
                {['IT', 'CE', 'CSE', 'ME', 'CIVIL', 'EE', 'EC', 'AIML'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Assign HOD (optional)</label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                value={projForm.hodId}
                onChange={e => setProjForm(f => ({ ...f, hodId: e.target.value }))}
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
                value={projForm.description} onChange={e => setProjForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">What to do</label>
              <textarea rows={2} className="w-full border rounded-lg px-3 py-2"
                value={projForm.whatToDo} onChange={e => setProjForm(f => ({ ...f, whatToDo: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Tech Stack</label>
              <input className="w-full border rounded-lg px-3 py-2" value={projForm.techStack}
                onChange={e => setProjForm(f => ({ ...f, techStack: e.target.value }))} placeholder="React, Node, MongoDB" />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Doc Link (Drive/URL)</label>
              <input className="w-full border rounded-lg px-3 py-2" value={projForm.docLink}
                onChange={e => setProjForm(f => ({ ...f, docLink: e.target.value }))} placeholder="https://drive.google.com/..." />
              <div className="text-xs text-slate-500 mt-1">Make sure “Anyone with the link can view”.</div>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Or Upload Doc (PDF/Image)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={e => setDocFile(e.target.files?.[0] || null)} />
              <div className="text-xs text-slate-500 mt-1">Stored in MongoDB (GridFS). Max 5MB.</div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button disabled={creating} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg">
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>

          {/* Existing projects */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="px-4 py-3 bg-slate-50 text-slate-800 flex items-center justify-between">
              <div className="font-medium">Existing Projects</div>
              <div className="text-xs text-slate-600">
                {totalProjects ? `Showing ${projStart + 1}-${projEnd} of ${totalProjects}` : 'No projects'}
              </div>
            </div>
            <div className="max-h-80 overflow-auto divide-y">
              {pageProjects.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm">No projects</div>
              ) : pageProjects.map(p => (
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
            <div className="px-4 py-3 bg-slate-50">
              <Pagination
                page={projPage}
                totalPages={projPages}
                onPage={setProjPage}
                pageSize={projPageSize}
                onPageSize={(n) => { setProjPageSize(n); setProjPage(1) }}
                sizes={[5, 10, 20]}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Bulk Import via Excel (collapsed initially) */}
        <CollapsibleSection id="import" title="Bulk Import via Excel" icon={<UploadIcon className="h-5 w-5" />}>
          <form onSubmit={submitExcel} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 text-xs text-slate-500">
              Columns: Title, Description, WhatToDo, TechStack, DocUrl, Department. Optional HOD will be assigned to all.
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Excel (.xlsx)</label>
              <input type="file" accept=".xlsx" onChange={e => setExcelFile(e.target.files?.[0] || null)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Assign HOD (optional)</label>
              <select className="w-full border rounded px-2 py-2" value={excelHodId} onChange={e => setExcelHodId(e.target.value)}>
                <option value="">No default HOD</option>
                {hods.map(h => <option value={h._id} key={h._id}>{h.name} - {h.department}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button disabled={excelUploading} className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg">
                {excelUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
          <p className="text-xs text-slate-500">Tip: Use a Google Drive link with “Anyone with the link can view”.</p>
        </CollapsibleSection>
      </main>
    </div>
  )
}

function StatCard({ title, value, color = 'emerald' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200', // unused
    sky: 'bg-sky-50 text-sky-700 border-sky-200', // unused
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
        <div className="h-full bg-emerald-300" style={{ width: `${s}%` }} title={`Submitted ${s}%`} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>Accepted: {accepted}</span>
        <span>Rejected: {rejected}</span>
        <span>Submitted: {submitted}</span>
      </div>
    </div>
  )
}

// Simple section nav (UI only) opens section if closed
function SectionNav({ items = [] }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {items.map(it => (
        <button
          key={it.id}
          className="px-3 py-1.5 text-sm rounded-md border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700"
          onClick={() => {
            const el = document.getElementById(it.id)
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            if (el && el.getAttribute('data-open') !== 'true') {
              el.querySelector('button')?.click()
            }
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

// UI-only: simple chevron
function ChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// UI-only: collapsible section container
function CollapsibleSection({ id, title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <section id={id} data-open={open ? 'true' : 'false'} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4">
        <span className="text-lg font-medium inline-flex items-center gap-2">{icon}{title}</span>
        <ChevronDown className={`h-5 w-5 text-slate-700 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}

// UI-only: pagination controls for projects
function Pagination({ page, totalPages, onPage, pageSize, onPageSize, sizes = [5, 10, 20] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize?.(Number(e.target.value))}
          className="border rounded px-2 py-1 bg-white text-sm"
        >
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-sm rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => onPage?.(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span className="text-sm text-slate-600 tabular-nums">Page {page} of {totalPages}</span>
        <button
          className="px-3 py-1.5 text-sm rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => onPage?.(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}