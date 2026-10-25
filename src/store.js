import { useEffect, useReducer } from 'react'

// ⚠️ Accès du directeur (à changer). Pour une vraie mise en production, utiliser un backend.
export const DIRECTOR = { email: 'directeur@eduplan.ma', password: 'admin123' }

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
export const SLOTS = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
]
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3)

export function weekStart(off = 0) {
  const d = new Date(); d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7)
  return d
}
export const fmt = (d, o) => d.toLocaleDateString('fr-FR', o)
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function mondayOf(str) { const d = new Date(str + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d }

function seed() {
  const subjects = ['Informatique', 'Programmation Python', 'Web Development', 'Mathématiques', 'Algorithmique', 'Réseaux', 'Bureautique']
    .map((name) => ({ id: uid(), name }))
  const teachers = [
    { name: 'Ahmed Benali', title: "Professeur d'Informatique", subjects: ['Informatique', 'Programmation Python', 'Web Development'], email: 'ahmed.benali@etablissement.ma', phone: '+212 6 12 34 56 78' },
    { name: 'Sara El Idrissi', title: 'Professeure de Mathématiques', subjects: ['Mathématiques', 'Algorithmique'], email: 'sara.elidrissi@etablissement.ma', phone: '+212 6 23 45 67 89' },
    { name: 'Youssef Alami', title: 'Professeur de Réseaux', subjects: ['Réseaux', 'Bureautique', 'Informatique'], email: 'youssef.alami@etablissement.ma', phone: '+212 6 34 56 78 90' },
  ].map((t) => ({ ...t, id: uid() }))
  const classes = ['1ère Info', '2ème Info', '3ème Info'].map((name, i) => ({
    id: uid(), name, level: `${i + 1}${i ? 'ème' : 'ère'} année`, filiere: 'Informatique', students: [24, 22, 18][i],
  }))
  const rooms = ['Salle A1', 'Salle B2', 'Salle B3']
  const lessons = []
  teachers.forEach((t, ti) => DAYS.forEach((_, d) => SLOTS.forEach((_, s) => lessons.push({
    id: uid(), teacherId: t.id, classId: classes[(ti + s + d) % 3].id,
    subject: t.subjects[(s + d) % t.subjects.length], day: d, slot: s, room: rooms[(ti + s + d) % 3],
  }))))
  return { subjects, teachers, classes, lessons, attendance: [] }
}

function reducer(db, a) {
  switch (a.type) {
    case 'upsert': {
      const list = db[a.kind], old = list.find((x) => x.id === a.item.id)
      const next = { ...db, [a.kind]: old ? list.map((x) => (x.id === a.item.id ? a.item : x)) : [...list, a.item] }
      if (a.kind === 'subjects' && old && old.name !== a.item.name) {
        next.teachers = next.teachers.map((t) => ({ ...t, subjects: t.subjects.map((s) => (s === old.name ? a.item.name : s)) }))
        next.lessons = next.lessons.map((l) => (l.subject === old.name ? { ...l, subject: a.item.name } : l))
      }
      return next
    }
    case 'remove': {
      const n = { ...db, [a.kind]: db[a.kind].filter((x) => x.id !== a.id) }
      if (a.kind === 'teachers') { n.lessons = db.lessons.filter((l) => l.teacherId !== a.id); n.attendance = db.attendance.filter((x) => x.teacherId !== a.id) }
      if (a.kind === 'classes') n.lessons = db.lessons.filter((l) => l.classId !== a.id)
      if (a.kind === 'subjects') {
        const nm = db.subjects.find((x) => x.id === a.id)?.name
        n.teachers = db.teachers.map((t) => ({ ...t, subjects: t.subjects.filter((s) => s !== nm) }))
        n.lessons = db.lessons.filter((l) => l.subject !== nm)
      }
      return n
    }
    case 'attendance': {
      const rest = db.attendance.filter((x) => !(x.teacherId === a.teacherId && x.date === a.date))
      return { ...db, attendance: a.status === 'clear' ? rest : [...rest, { id: uid(), teacherId: a.teacherId, date: a.date, status: a.status }] }
    }
    case 'reset': return seed()
    default: return db
  }
}

export function useStore() {
  const [db, dispatch] = useReducer(reducer, null, () => {
    try { return { attendance: [], ...(JSON.parse(localStorage.getItem('eduplan-db')) || seed()) } } catch { return seed() }
  })
  useEffect(() => { localStorage.setItem('eduplan-db', JSON.stringify(db)) }, [db])
  return [db, dispatch]
}
