import { useState } from 'react'
import { uid, DIRECTOR } from './store.js'
import { Icon, Modal, Field, PageHead } from './ui.jsx'

const ask = (msg, fn) => confirm(msg) && fn()
const Btn = ({ onClick, children }) => <button className="btn dk" onClick={onClick}><Icon n="plus" s={16} /> {children}</button>
const Acts = ({ onEdit, onDel, extra }) => (
  <td className="acts">{extra}<button className="ic" title="Modifier" onClick={onEdit}><Icon n="edit" s={17} /></button>
    <button className="ic red" title="Supprimer" onClick={onDel}><Icon n="trash" s={17} /></button></td>
)

export function Home({ db, go, openForm }) {
  const stats = [['Professeurs', db.teachers.length, 'user'], ['Classes', db.classes.length, 'users'], ['Matières', db.subjects.length, 'book'], ['Cours planifiés', db.lessons.length, 'calendar']]
  return (
    <div className="page"><PageHead icon="home" title="Accueil" />
      <div className="stats">{stats.map(([l, v, i]) => <div key={l} className="card stat"><span className="ib"><Icon n={i} /></span><div><b>{v}</b><p>{l}</p></div></div>)}</div>
      <div className="card"><h3>Actions rapides du directeur</h3>
        <div className="qrow">
          <button className="btn dk" onClick={() => openForm('teacher')}><Icon n="plus" s={16} /> Ajouter un professeur</button>
          <button className="btn dk" onClick={() => openForm('class')}><Icon n="plus" s={16} /> Ajouter une classe</button>
          <button className="btn" onClick={() => go('schedule')}><Icon n="calendar" s={16} /> Gérer l'emploi du temps</button>
        </div></div>
    </div>
  )
}

export function TeacherForm({ db, act, init, onClose }) {
  const [f, setF] = useState({ name: '', title: '', email: '', phone: '', subjects: [], ...init })
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }))
  const tog = (s) => set('subjects', f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s])
  return (
    <Modal title={f.id ? 'Modifier le professeur' : 'Ajouter un professeur'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return; act({ type: 'upsert', kind: 'teachers', item: { ...f, id: f.id || uid() } }); onClose() }}>
        <Field label="Nom complet"><input required value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Titre"><input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Professeur d'Informatique" /></Field>
        <Field label="Email"><input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Téléphone"><input value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Matières enseignées">
          <div className="chk">{db.subjects.map((s) => <label key={s.id}><input type="checkbox" checked={f.subjects.includes(s.name)} onChange={() => tog(s.name)} /> {s.name}</label>)}</div>
        </Field>
        <div className="mf"><span style={{ flex: 1 }} /><button type="button" className="btn" onClick={onClose}>Annuler</button><button className="btn dk">Enregistrer</button></div>
      </form>
    </Modal>
  )
}

export function Teachers({ db, act, q, go, setM }) {
  const list = db.teachers.filter((t) => (t.name + t.title + t.subjects.join()).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="page"><PageHead icon="user" title="Professeurs" action={<Btn onClick={() => setM({ kind: 'teacher', init: {} })}>Ajouter un professeur</Btn>} />
      <div className="card"><table className="list"><thead><tr><th>Professeur</th><th>Matières</th><th>Contact</th><th>Cours / sem.</th><th /></tr></thead>
        <tbody>{list.map((t) => (
          <tr key={t.id}><td><b>{t.name}</b><p>{t.title}</p></td><td>{t.subjects.join(', ')}</td><td>{t.email}<p>{t.phone}</p></td>
            <td>{db.lessons.filter((l) => l.teacherId === t.id).length}</td>
            <Acts onEdit={() => setM({ kind: 'teacher', init: t })}
              onDel={() => ask(`Supprimer ${t.name} et tous ses cours ?`, () => act({ type: 'remove', kind: 'teachers', id: t.id }))}
              extra={<button className="ic" title="Voir le planning" onClick={() => go('schedule', { t: t.id, mode: 'prof' })}><Icon n="calendar" s={17} /></button>} /></tr>))}
        </tbody></table>{!list.length && <p className="mu pad">Aucun professeur.</p>}</div>
    </div>
  )
}

export function ClassForm({ act, init, onClose }) {
  const [f, setF] = useState({ name: '', level: '', filiere: '', students: 0, ...init })
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }))
  return (
    <Modal title={f.id ? 'Modifier la classe' : 'Ajouter une classe'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); act({ type: 'upsert', kind: 'classes', item: { ...f, students: +f.students || 0, id: f.id || uid() } }); onClose() }}>
        <Field label="Nom de la classe"><input required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="1ère Info" /></Field>
        <Field label="Niveau"><input value={f.level} onChange={(e) => set('level', e.target.value)} placeholder="1ère année" /></Field>
        <Field label="Filière"><input value={f.filiere} onChange={(e) => set('filiere', e.target.value)} placeholder="Informatique" /></Field>
        <Field label="Nombre d'étudiants"><input type="number" min="0" value={f.students} onChange={(e) => set('students', e.target.value)} /></Field>
        <div className="mf"><span style={{ flex: 1 }} /><button type="button" className="btn" onClick={onClose}>Annuler</button><button className="btn dk">Enregistrer</button></div>
      </form>
    </Modal>
  )
}

export function Classes({ db, act, q, go, setM }) {
  const list = db.classes.filter((c) => (c.name + c.level + c.filiere).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="page"><PageHead icon="users" title="Classes" action={<Btn onClick={() => setM({ kind: 'class', init: {} })}>Ajouter une classe</Btn>} />
      <div className="card"><table className="list"><thead><tr><th>Classe</th><th>Niveau</th><th>Filière</th><th>Étudiants</th><th>Cours / sem.</th><th /></tr></thead>
        <tbody>{list.map((c) => (
          <tr key={c.id}><td><b>{c.name}</b></td><td>{c.level}</td><td>{c.filiere}</td><td>{c.students}</td>
            <td>{db.lessons.filter((l) => l.classId === c.id).length}</td>
            <Acts onEdit={() => setM({ kind: 'class', init: c })}
              onDel={() => ask(`Supprimer la classe ${c.name} et ses cours ?`, () => act({ type: 'remove', kind: 'classes', id: c.id }))}
              extra={<button className="ic" title="Voir le planning" onClick={() => go('schedule', { c: c.id, mode: 'classe' })}><Icon n="calendar" s={17} /></button>} /></tr>))}
        </tbody></table>{!list.length && <p className="mu pad">Aucune classe.</p>}</div>
    </div>
  )
}

export function Subjects({ db, act, q }) {
  const [m, setM] = useState(null)
  const list = db.subjects.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
  const save = (e) => { e.preventDefault(); if (!m.name.trim()) return; act({ type: 'upsert', kind: 'subjects', item: { id: m.id || uid(), name: m.name.trim() } }); setM(null) }
  return (
    <div className="page"><PageHead icon="book" title="Matières" action={<Btn onClick={() => setM({ name: '' })}>Ajouter une matière</Btn>} />
      <div className="card"><table className="list"><thead><tr><th>Matière</th><th>Professeurs</th><th /></tr></thead>
        <tbody>{list.map((s) => (
          <tr key={s.id}><td><b>{s.name}</b></td><td>{db.teachers.filter((t) => t.subjects.includes(s.name)).map((t) => t.name).join(', ') || '—'}</td>
            <Acts onEdit={() => setM(s)} onDel={() => ask(`Supprimer la matière ${s.name} et ses cours ?`, () => act({ type: 'remove', kind: 'subjects', id: s.id }))} /></tr>))}
        </tbody></table></div>
      {m && <Modal title={m.id ? 'Modifier la matière' : 'Ajouter une matière'} onClose={() => setM(null)}>
        <form onSubmit={save}><Field label="Nom de la matière"><input autoFocus value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} /></Field>
          <div className="mf"><span style={{ flex: 1 }} /><button type="button" className="btn" onClick={() => setM(null)}>Annuler</button><button className="btn dk">Enregistrer</button></div></form>
      </Modal>}
    </div>
  )
}

export function Reports({ db }) {
  return (
    <div className="page"><PageHead icon="chart" title="Rapports" />
      <div className="card"><h3>Charge horaire des professeurs</h3><table className="list"><thead><tr><th>Professeur</th><th>Heures / semaine</th><th>Classes</th><th>Jours d'absence</th></tr></thead>
        <tbody>{db.teachers.map((t) => <tr key={t.id}><td><b>{t.name}</b></td><td>{db.lessons.filter((l) => l.teacherId === t.id).length} h</td>
          <td>{new Set(db.lessons.filter((l) => l.teacherId === t.id).map((l) => l.classId)).size}</td>
          <td>{db.attendance.filter((a) => a.teacherId === t.id && a.status === 'absent').length}</td></tr>)}</tbody></table></div>
      <div className="card"><h3>Remplissage des classes (40 h possibles)</h3><table className="list"><thead><tr><th>Classe</th><th>Heures planifiées</th><th>Créneaux libres</th></tr></thead>
        <tbody>{db.classes.map((c) => { const n = db.lessons.filter((l) => l.classId === c.id).length; return <tr key={c.id}><td><b>{c.name}</b></td><td>{n} h</td><td>{40 - n}</td></tr> })}</tbody></table></div>
    </div>
  )
}

export function Settings({ db, act, user, setUser }) {
  return (
    <div className="page"><PageHead icon="gear" title="Paramètres" />
      <div className="card"><h3>Compte du directeur</h3>
        <Field label="Nom affiché"><input value={user} onChange={(e) => setUser(e.target.value)} /></Field>
        <p className="mu">Identifiant : {DIRECTOR.email} (à modifier dans <code>src/store.js</code>)</p></div>
      <div className="card"><h3>Données</h3><p className="mu">Les données sont enregistrées dans ce navigateur.</p>
        <button className="btn danger" onClick={() => ask('Réinitialiser toutes les données avec les exemples ?', () => act({ type: 'reset' }))}>Réinitialiser les données</button></div>
    </div>
  )
}
