import React, { useEffect, useState } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import AdminRegisterUser from '../../components/AdminRegisterUser'
import { listAdminHods, listAdminProjects, createAdminProject, assignAdminProject, bulkProjectsExcel } from '../../api/admin'

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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  const [selectedRole, setSelectedRole] = useState('hod')
  const [showStats, setShowStats] = useState(false)
  const [statsTab, setStatsTab] = useState(null)
  const stats = { total: 12, accepted: 5, rejected: 2 }

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

        {/* Applications Overview (collapsible) */}
        <AccordionSection
          icon={<GraphIcon className="h-5 w-5" />}
          title="Applications Overview"
          subtitle="Quick glance at totals and status"
          open={openApps}
          onToggle={() => setOpenApps(v => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-md overflow-hidden border bg-white">
              <button
                className={`px-4 py-2 ${statsTab === 'total' && showStats ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}
                onClick={() => { setStatsTab('total'); setShowStats(true) }}
              >
                Total Applications
              </button>
              <button
                className={`px-4 py-2 ${statsTab === 'status' && showStats ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}
                onClick={() => { setStatsTab('status'); setShowStats(true) }}
              >
                Accepted / Rejected
              </button>
            </div>
          </div>
          {showStats && (
            <div className="rounded-xl border p-4 bg-slate-50 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  {statsTab === 'total' ? 'Total Applications' : 'Accepted / Rejected'}
                </div>
                <button onClick={() => setShowStats(false)} className="text-slate-500 hover:text-slate-700">Close</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total" value={stats.total} color="indigo" />
                <StatCard title="Accepted" value={stats.accepted} color="emerald" />
                <StatCard title="Rejected" value={stats.rejected} color="rose" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Demo stats (replace with API later)</p>
            </div>
          )}
        </AccordionSection>

        {/* Register HOD/Faculty (collapsible) */}
        <AccordionSection
          icon={<UsersIcon className="h-5 w-5" />}
          title="Register HOD / Faculty"
          subtitle="Create accounts for department heads and staff"
          open={openRegister}
          onToggle={() => setOpenRegister(v => !v)}
        >
          <div className="flex items-center justify-between">
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
          </div>
          <div className="mt-4">
            <AdminRegisterUser forcedRole={selectedRole} />
          </div>
        </AccordionSection>

        {/* Projects (collapsible) */}
        <AccordionSection
          icon={<FolderIcon className="h-5 w-5" />}
          title="Projects (Assign to HOD)"
          subtitle="Create projects, upload docs, and assign to HOD"
          open={openProjects}
          onToggle={() => setOpenProjects(v => !v)}
        >
 
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
               <select className="w-full border rounded-lg px-3 py-2" value={projForm.hodId}
                       onChange={e=>setProjForm(f=>({...f,hodId:e.target.value}))}>
                 <option value="">Select HOD</option>
                 {hods.filter(h=>h.department===projForm.department).map(h => (
                   <option key={h._id} value={h._id}>{h.name} ({h.email})</option>
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
               <button disabled={creating} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg">
                 {creating ? 'Creating...' : 'Create Project'}
               </button>
             </div>
           </form>
 
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <div className="rounded-xl border overflow-hidden">
               <div className="px-4 py-3 bg-slate-50 font-medium">Existing Projects</div>
               <div className="max-h-80 overflow-auto divide-y">
                 {projects.length === 0 ? (
                   <div className="p-4 text-slate-500 text-sm">No projects</div>
                 ) : projects.map(p => (
                   <div key={p._id} className="p-4 space-y-1">
                     <div className="font-medium">{p.title} <span className="text-xs text-slate-500">[{p.department}]</span></div>
                     <div className="text-sm text-slate-700">{p.description || '—'}</div>
                     {p.docLink && <a href={p.docLink} target="_blank" rel="noreferrer" className="text-indigo-700 underline text-sm">View Doc</a>}
                     <div className="flex items-center gap-2 text-sm">
                       <span>HOD:</span>
                       <select
                         value={p.assignedHod?._id || ''}
                         onChange={async (e) => {
                           const hid = e.target.value
                           try { await assignAdminProject(p._id, hid); setToast('HOD assigned') }
                           catch (err) { setToast(err.message) }
                         }}
                         className="border rounded px-2 py-1"
                       >
                         <option value="">Unassigned</option>
                         {hods.filter(h=>h.department===p.department).map(h=>(
                           <option key={h._id} value={h._id}>{h.name}</option>
                         ))}
                       </select>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
 
             <form onSubmit={submitExcel} className="rounded-xl border p-4 space-y-3">
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
               <button disabled={excelUploading} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg">
                 {excelUploading ? 'Uploading...' : 'Upload'}
               </button>
             </form>
           </div>
 
           <p className="text-xs text-slate-500">
             Tip: Use a Google Drive link with “Anyone with the link can view”, or upload a PDF/image which is stored in MongoDB and served at /files/:id.
           </p>
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