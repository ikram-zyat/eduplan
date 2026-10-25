import { useState } from 'react'
import { useStore, DIRECTOR } from './store.js'
import { Icon, Avatar } from './ui.jsx'
import Schedule from './Schedule.jsx'
import { Home, Teachers, TeacherForm, Classes, ClassForm, Subjects, Reports, Settings } from './pages.jsx'

const NAV = [['home', 'Accueil', 'home'], ['schedule', 'Emploi du temps', 'calendar'], ['teachers', 'Professeurs', 'user'],
  ['classes', 'Classes', 'users'], ['subjects', 'Matières', 'book'], ['reports', 'Rapports', 'chart'], ['settings', 'Paramètres', 'gear']]

function Login({ onOk }) {
  const [e, setE] = useState(''), [p, setP] = useState(''), [err, setErr] = useState(false)
  return (
    <div className="login">
      <form className="lbox" onSubmit={(ev) => { ev.preventDefault(); e === DIRECTOR.email && p === DIRECTOR.password ? onOk() : setErr(true) }}>
        <div className="logo big"><Icon n="cap" s={40} /><div>EduPlan<small>Espace du directeur</small></div></div>
        <label className="f"><span>Email</span><input value={e} onChange={(x) => setE(x.target.value)} placeholder={DIRECTOR.email} autoFocus /></label>
        <label className="f"><span>Mot de passe</span><input type="password" value={p} onChange={(x) => setP(x.target.value)} /></label>
        {err && <div className="err">Email ou mot de passe incorrect.</div>}
        <button className="btn dk full">Se connecter</button>
      </form>
    </div>
  )
}

export default function App() {
  const [db, act] = useStore()
  const [auth, setAuth] = useState(() => localStorage.getItem('eduplan-auth') === '1')
  const [user, setUser] = useState(() => localStorage.getItem('eduplan-user') || 'Directeur')
  const [page, setPage] = useState('schedule')
  const [q, setQ] = useState('')
  const [flt, setFlt] = useState({ t: db.teachers[0]?.id || 'all', c: 'all', mode: 'prof' })
  const [m, setM] = useState(null)
  const [menu, setMenu] = useState(false)

  if (!auth) return <Login onOk={() => { localStorage.setItem('eduplan-auth', '1'); setAuth(true) }} />
  const go = (p, f) => { if (f) setFlt({ t: 'all', c: 'all', mode: 'prof', ...f }); setPage(p); setQ('') }
  const upUser = (v) => { setUser(v); localStorage.setItem('eduplan-user', v) }
  const tf = flt.t !== 'all' && !db.teachers.some((t) => t.id === flt.t) ? { ...flt, t: 'all' } : flt

  return (
    <div className="app">
      <aside className="sb noprint">
        <div className="logo"><Icon n="cap" s={38} /><div>EduPlan<small>Gestion du temps des professeurs</small></div></div>
        <nav>{NAV.map(([k, l, i]) => <button key={k} className={page === k ? 'on' : ''} onClick={() => go(k)}><Icon n={i} /> {l}</button>)}</nav>
        <div className="help"><Icon n="help" s={26} /><div><b>Besoin d'aide ?</b><small>Contactez l'administration</small></div></div>
      </aside>
      <div className="content">
        <header className="top noprint">
          <div className="search"><Icon n="search" s={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un professeur, une classe, une matière..." /></div>
          <span className="bell"><Icon n="bell" /><i /></span>
          <div className="usr" onClick={() => setMenu(!menu)}><Avatar size={36} /><b>{user}</b>▾
            {menu && <div className="dd" onClick={() => { localStorage.removeItem('eduplan-auth'); setAuth(false) }}><Icon n="logout" s={16} /> Se déconnecter</div>}</div>
        </header>
        {page === 'home' && <Home db={db} go={go} openForm={(k) => setM({ kind: k, init: {} })} />}
        {page === 'schedule' && <Schedule db={db} act={act} flt={tf} setFlt={setFlt} editTeacher={(t) => setM({ kind: 'teacher', init: t })} editClass={(c) => setM({ kind: 'class', init: c })} />}
        {page === 'teachers' && <Teachers db={db} act={act} q={q} go={go} setM={setM} />}
        {page === 'classes' && <Classes db={db} act={act} q={q} go={go} setM={setM} />}
        {page === 'subjects' && <Subjects db={db} act={act} q={q} />}
        {page === 'reports' && <Reports db={db} />}
        {page === 'settings' && <Settings db={db} act={act} user={user} setUser={upUser} />}
      </div>
      {m?.kind === 'teacher' && <TeacherForm db={db} act={act} init={m.init} onClose={() => setM(null)} />}
      {m?.kind === 'class' && <ClassForm act={act} init={m.init} onClose={() => setM(null)} />}
    </div>
  )
}
