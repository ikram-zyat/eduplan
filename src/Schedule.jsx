import { useState } from 'react'
import { DAYS, SLOTS, uid, mondayOf, iso, fmt } from './store.js'
import { Icon, Avatar, Modal, Field, PageHead } from './ui.jsx'

function LessonForm({ db, act, init, onClose }) {
  const [f, setF] = useState({ room: '', subject: '', ...init })
  const [err, setErr] = useState('')
  const teacher = db.teachers.find((t) => t.id === f.teacherId)
  const subjects = teacher ? teacher.subjects : db.subjects.map((s) => s.name)
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }))

  function save(e) {
    e.preventDefault()
    if (!f.teacherId && !f.classId) return setErr('Choisissez au moins un professeur ou une classe.')
    const at = db.lessons.filter((l) => l.id !== f.id && l.day === f.day && l.slot === f.slot)
    if (f.teacherId && at.some((l) => l.teacherId === f.teacherId)) return setErr('Ce professeur a déjà un cours à cette heure.')
    if (f.classId && at.some((l) => l.classId === f.classId)) return setErr('Cette classe a déjà un cours à cette heure.')
    if (f.room.trim() && at.some((l) => (l.room || '').toLowerCase() === f.room.trim().toLowerCase())) return setErr('Cette salle est déjà occupée à cette heure.')
    act({ type: 'upsert', kind: 'lessons', item: { ...f, id: f.id || uid(), room: f.room.trim() } })
    onClose()
  }
  function del() {
    if (confirm('Supprimer ce cours ?')) { act({ type: 'remove', kind: 'lessons', id: f.id }); onClose() }
  }
  return (
    <Modal title={`${f.id ? 'Modifier' : 'Ajouter'} un cours – ${DAYS[f.day]} ${SLOTS[f.slot]}`} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Professeur (facultatif)">
          <select value={f.teacherId || ''} onChange={(e) => {
            const t = db.teachers.find((x) => x.id === e.target.value)
            setF((o) => ({ ...o, teacherId: e.target.value, subject: t ? t.subjects[0] || '' : '' }))
          }}>
            <option value="">— Aucun —</option>
            {db.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Classe (facultatif)">
          <select value={f.classId || ''} onChange={(e) => set('classId', e.target.value)}>
            <option value="">— Aucun —</option>
            {db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Matière (facultatif)">
          <select value={f.subject} onChange={(e) => set('subject', e.target.value)}>
            <option value="">— Aucun —</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Salle (facultatif)"><input value={f.room} onChange={(e) => set('room', e.target.value)} placeholder="Salle A1" /></Field>
        {err && <div className="err">{err}</div>}
        <div className="mf">
          {f.id && <button type="button" className="btn danger" onClick={del}>Supprimer</button>}
          <span style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button className="btn dk">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Schedule({ db, act, flt, setFlt, editTeacher, editClass }) {
  const [wd, setWd] = useState(() => localStorage.getItem('eduplan-week') || '')
  const [m, setM] = useState(null)
  const pick = (v) => { setWd(v); localStorage.setItem('eduplan-week', v) }
  const shift = (n) => { const d = new Date(wd + 'T12:00:00'); d.setDate(d.getDate() + 7 * n); pick(iso(d)) }
  const mon = wd ? mondayOf(wd) : null
  const day = (i) => { const d = new Date(mon); d.setDate(d.getDate() + i); return d }
  const dayIso = (i) => (mon ? iso(day(i)) : null)
  const status = (tid, i) => {
    const r = mon && db.attendance.find((a) => a.teacherId === tid && a.date === dayIso(i))
    return r ? r.status : null
  }
  const mark = (tid, i, st) => act({ type: 'attendance', teacherId: tid, date: dayIso(i), status: status(tid, i) === st ? 'clear' : st })
  const T = db.teachers.find((t) => t.id === flt.t)
  const byClass = flt.mode === 'classe'
  const C = db.classes.find((c) => c.id === flt.c)
  const one = !byClass && flt.t !== 'all' && T
  const classTeachers = byClass && C ? db.teachers.filter((t) => db.lessons.some((l) => l.classId === C.id && l.teacherId === t.id)) : []
  const classSubjects = byClass && C ? [...new Set(db.lessons.filter((l) => l.classId === C.id).map((l) => l.subject).filter(Boolean))] : []
  const cls = (id) => db.classes.find((c) => c.id === id)
  const tch = (id) => db.teachers.find((t) => t.id === id)
  const at = (d, s) => db.lessons.filter((l) => l.day === d && l.slot === s &&
    (!one || l.teacherId === T.id) && (flt.c === 'all' || l.classId === flt.c))
  const mine = one ? db.lessons.filter((l) => l.teacherId === T.id) : []
  const myClasses = db.classes.filter((c) => mine.some((l) => l.classId === c.id))
  const label = mon ? `Semaine du ${fmt(day(0), { day: 'numeric', month: 'long' })} au ${fmt(day(4), { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Semaine non sélectionnée'

  return (
    <div className="split">
      <div className="main">
        <PageHead icon="calendar" title={byClass ? 'Emploi du temps - Classes' : 'Emploi du temps - Professeurs'} />
        <div className="tabs noprint">
          <button className={!byClass ? 'on' : ''} onClick={() => setFlt({ ...flt, mode: 'prof', c: 'all' })}>Planning des professeurs</button>
          <button className={byClass ? 'on' : ''} onClick={() => setFlt({ ...flt, mode: 'classe', t: 'all', c: flt.c === 'all' ? (db.classes[0]?.id || 'all') : flt.c })}>Planning des classes</button>
        </div>
        <div className="filters noprint">
          <div className="wk">
            <button disabled={!mon} onClick={() => shift(-1)} title="Semaine précédente">‹</button>
            <Icon n="calendar" s={16} />
            <input type="date" value={wd} onChange={(e) => pick(e.target.value)} title="Choisir une date de la semaine" />
            <button disabled={!mon} onClick={() => shift(1)} title="Semaine suivante">›</button>
          </div>
          <span className="mu">{mon ? label : 'Choisissez une date dans le calendrier'}</span>
          {!byClass && (
            <select value={flt.t} onChange={(e) => setFlt({ ...flt, t: e.target.value })}>
              <option value="all">Tous les professeurs</option>
              {db.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <select value={flt.c} onChange={(e) => setFlt({ ...flt, c: e.target.value })}>
            <option value="all">Toutes les classes</option>
            {db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span style={{ flex: 1 }} />
          <button className="btn dk" onClick={() => { alert("Choisissez « Enregistrer au format PDF » dans la fenêtre d'impression."); window.print() }}><Icon n="download" s={16} /> Télécharger (PDF)</button>
          <button className="btn" onClick={() => window.print()}><Icon n="printer" s={16} /> Imprimer</button>
        </div>
        <h1 className="pt">Emploi du temps – {byClass && C ? C.name : one ? T.name : 'Tous les professeurs'} – {label}</h1>

        <div className="card tcard">
          {byClass && C ? <span className="ib big"><Icon n="users" s={30} /></span> : <Avatar size={68} />}
          <div className="tname"><h2>{byClass && C ? C.name : one ? T.name : 'Tous les professeurs'}</h2>
            <p>{byClass && C ? `${C.level} · ${C.filiere} · ${C.students} étudiants` : one ? T.title : `${db.teachers.length} professeurs · ${db.classes.length} classes`}</p></div>
          {one && <>
            <div className="tinfo"><Icon n="book" s={22} /><div><b>Matières enseignées</b><p>{T.subjects.join(', ') || '—'}</p></div></div>
            <div className="tinfo"><Icon n="users" s={22} /><div><b>Classes</b><p>{myClasses.map((c) => c.name).join(', ') || '—'}</p></div></div>
          </>}
          {byClass && C && <>
            <div className="tinfo"><Icon n="user" s={22} /><div><b>Professeurs</b><p>{classTeachers.map((t) => t.name).join(', ') || '—'}</p></div></div>
            <div className="tinfo"><Icon n="book" s={22} /><div><b>Matières</b><p>{classSubjects.join(', ') || '—'}</p></div></div>
          </>}
        </div>

        <div className="card tw"><table className="tt">
          <thead><tr><th className="hh">Heure</th>{DAYS.map((d, i) => <th key={d}>{d}<small>{mon ? fmt(day(i), { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</small>{one && status(T.id, i) && <em className={`tag ${status(T.id, i)}`}>{status(T.id, i) === 'absent' ? 'Absent' : 'Présent'}</em>}</th>)}</tr></thead>
          <tbody>{SLOTS.flatMap((t, s) => {
            const row = (
              <tr key={s}>
                <td className="hc"><Icon n="clock" s={16} /> {t}</td>
                {DAYS.map((_, d) => (
                  <td key={d} className="slot" onClick={() => setM({ day: d, slot: s, teacherId: one ? T.id : '', classId: flt.c === 'all' ? '' : flt.c, subject: one ? T.subjects[0] || '' : '' })}>
                    {at(d, s).map((l) => {
                      const c = cls(l.classId)?.name, t = tch(l.teacherId)?.name
                      const title = byClass ? (l.subject || 'Cours') : (c || l.subject || 'Cours')
                      const line2 = byClass ? (t ? `Prof. ${t}` : 'Sans professeur')
                        : [c && l.subject ? l.subject : '', !one && t ? t : ''].filter(Boolean).join(' · ')
                      return (
                        <div key={l.id} className={`les${status(l.teacherId, d) === 'absent' ? ' abs' : ''}`} onClick={(e) => { e.stopPropagation(); setM(l) }}>
                          <b>{title}</b>{status(l.teacherId, d) === 'absent' && <em className="tag absent">Absent</em>}{line2 && <span>{line2}</span>}{l.room && <span>{l.room}</span>}
                        </div>
                      )
                    })}
                    <div className="add noprint"><Icon n="plus" s={14} /> Ajouter</div>
                  </td>
                ))}
              </tr>
            )
            return s === 4
              ? [<tr key="l" className="lunch"><td className="hc"><Icon n="clock" s={16} /> 12:00 - 13:00</td><td colSpan="5">Pause déjeuner</td></tr>, row]
              : [row]
          })}</tbody>
        </table></div>
      </div>

      <aside className="rp noprint">
        {byClass && C ? <>
          <div className="card">
            <h3>Informations de la classe</h3>
            <div className="ip"><span className="ib"><Icon n="users" /></span><div><b>{C.name}</b><p>{C.level} · {C.filiere}</p></div></div>
            <div className="row"><Icon n="user" /><div><b>Étudiants</b><p>{C.students}</p></div></div>
            <button className="btn full" onClick={() => editClass(C)}><Icon n="edit" s={16} /> Modifier la classe</button>
          </div>
          <div className="card">
            <h3>Professeurs de cette classe</h3>
            {classTeachers.length === 0 && <p className="mu">Aucun cours planifié.</p>}
            {classTeachers.map((t) => (
              <div key={t.id} className="cl"><b>{t.name}</b>
                <p>{[...new Set(db.lessons.filter((l) => l.classId === C.id && l.teacherId === t.id).map((l) => l.subject).filter(Boolean))].join(' / ')}</p></div>
            ))}
          </div>
        </> : one ? <>
          <div className="card">
            <h3>Informations du professeur</h3>
            <div className="ip"><Avatar size={56} /><div><b>{T.name}</b><p>{T.title}</p></div></div>
            <div className="row"><Icon n="book" /><div><b>Matières</b><p>{T.subjects.join(', ') || '—'}</p></div></div>
            <div className="row"><Icon n="users" /><div><b>Classes</b><p>{myClasses.map((c) => c.name).join(', ') || '—'}</p></div></div>
            <div className="row"><Icon n="mail" /><div><b>Email</b><p>{T.email}</p></div></div>
            <div className="row"><Icon n="phone" /><div><b>Téléphone</b><p>{T.phone}</p></div></div>
            <button className="btn full" onClick={() => editTeacher(T)}><Icon n="edit" s={16} /> Modifier le professeur</button>
          </div>
          <div className="card">
            <h3>Liste des classes de ce professeur</h3>
            {myClasses.length === 0 && <p className="mu">Aucun cours planifié.</p>}
            {myClasses.map((c) => (
              <div key={c.id} className="cl"><b>{c.name}</b>
                <p>{[...new Set(mine.filter((l) => l.classId === c.id).map((l) => l.subject))].join(' / ')}</p></div>
            ))}
          </div>
          <div className="card">
            <h3>Présence – {T.name}</h3>
            {!mon ? <p className="mu">Choisissez une date dans le calendrier (en haut) pour noter la présence de la semaine.</p> : DAYS.map((d, i) => {
              const st = status(T.id, i)
              return (
                <div key={d} className="att">
                  <div><b>{d}</b><p>{fmt(day(i), { day: 'numeric', month: 'long' })}</p></div>
                  <div className="seg">
                    <button className={st === 'present' ? 'on ok' : ''} onClick={() => mark(T.id, i, 'present')}>Présent</button>
                    <button className={st === 'absent' ? 'on ko' : ''} onClick={() => mark(T.id, i, 'absent')}>Absent</button>
                  </div>
                </div>
              )
            })}
          </div>
        </> : (
          <div className="card"><h3>Professeurs</h3><p className="mu">Choisissez un professeur pour voir et modifier son planning.</p>
            {db.teachers.map((t) => <div key={t.id} className="cl pick" onClick={() => setFlt({ ...flt, t: t.id })}><b>{t.name}</b><p>{t.subjects.join(' / ')}</p></div>)}
          </div>
        )}
        <div className="card">
          <h3>Actions rapides</h3>
          <div className="qa" onClick={() => { alert("Choisissez « Enregistrer au format PDF » dans la fenêtre d'impression."); window.print() }}><span className="ib"><Icon n="download" /></span><div><b>Télécharger le planning (PDF)</b><p>Version complète du planning</p></div></div>
          <div className="qa" onClick={() => window.print()}><span className="ib"><Icon n="printer" /></span><div><b>Imprimer le planning</b><p>Pour le professeur ou les étudiants</p></div></div>
          <div className="info"><Icon n="help" s={20} /> Vous pouvez télécharger ou imprimer le planning selon vos besoins.</div>
        </div>
      </aside>
      {m && <LessonForm db={db} act={act} init={m} onClose={() => setM(null)} />}
    </div>
  )
}
