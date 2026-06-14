import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export default function App() {
  const [session, setSession] = useState(null)
  const [member, setMember] = useState(null)
  const [scores, setScores] = useState([])
  const [editions, setEditions] = useState([])
  const [editionId, setEditionId] = useState(null)
  const [page, setPage] = useState("classement")
  const [form, setForm] = useState({ edition_id: "", type: "action", quantity: 1 })
  const [message, setMessage] = useState("")
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  useEffect(() => {
    if (!session) return
    supabase.from("members").select("*").eq("user_id", session.user.id).single()
      .then(({ data }) => setMember(data))
    supabase.from("editions").select("*").then(({ data }) => {
      setEditions(data)
      if (data.length > 0) {
        setEditionId(data[0].id)
        setForm(f => ({ ...f, edition_id: data[0].id }))
      }
    })
  }, [session])

  useEffect(() => {
    if (!editionId) return
    supabase.from("scores").select("*").eq("edition_id", editionId).then(({ data }) => setScores(data))
  }, [editionId])

  const handleLogin = async () => {
    setLoginError("")
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password
    })
    if (error) setLoginError("Email ou mot de passe incorrect")
  }

  const handleSubmit = async () => {
    if (!member) return
    const { error } = await supabase.from("activities").insert([{
      member_id: member.id,
      edition_id: parseInt(form.edition_id),
      type: form.type,
      quantity: parseInt(form.quantity)
    }])
    if (error) {
      setMessage("❌ Erreur : " + error.message)
    } else {
      setMessage("✅ Activité ajoutée !")
      supabase.from("scores").select("*").eq("edition_id", editionId).then(({ data }) => setScores(data))
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const medals = ["🥇", "🥈", "🥉"]
  const types = ["vente", "plantation", "action", "armu", "fleeca", "prison"]

  const btn = (label, target) => (
    <button onClick={() => setPage(target)} style={{
      padding: "8px 20px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer",
      background: page === target ? "#222" : "#fff", color: page === target ? "#fff" : "#222"
    }}>{label}</button>
  )

  if (!session) return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: "2rem", fontFamily: "sans-serif", background: "#f9f9f9", borderRadius: 12 }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>🏆 French Riviera</h1>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Email</label>
        <input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Mot de passe</label>
        <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} />
      </div>
      {loginError && <p style={{ color: "red", textAlign: "center" }}>{loginError}</p>}
      <button onClick={handleLogin} style={{
        width: "100%", padding: 12, borderRadius: 8, border: "none",
        background: "#222", color: "#fff", fontSize: 16, cursor: "pointer"
      }}>Se connecter</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>🏆 French Riviera</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#666", fontSize: 14 }}>👤 {member?.name}</span>
          <button onClick={() => supabase.auth.signOut()} style={{
            padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc",
            background: "#fff", cursor: "pointer", fontSize: 13
          }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: "1.5rem" }}>
        {btn("Classement", "classement")}
        {btn("Saisir activité", "saisie")}
      </div>

      {page === "classement" && <>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: "1.5rem" }}>
          {editions.map(e => (
            <button key={e.id} onClick={() => setEditionId(e.id)} style={{
              padding: "6px 16px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer",
              background: editionId === e.id ? "#222" : "#fff", color: editionId === e.id ? "#fff" : "#222"
            }}>{e.name}</button>
          ))}
        </div>
        {scores.length === 0
          ? <p style={{ textAlign: "center", color: "#999" }}>Aucune activité pour cette édition.</p>
          : scores.map((s, i) => (
            <div key={s.member_id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", marginBottom: 8, borderRadius: 10,
              border: "1px solid #eee", background: i === 0 ? "#fffbea" : "#fff"
            }}>
              <span style={{ fontSize: 24 }}>{medals[i] || `#${i + 1}`}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{s.member_name}</span>
              <span style={{ fontWeight: 700, fontSize: 18 }}>{s.points} pts</span>
            </div>
          ))
        }
      </>}

      {page === "saisie" && (
        <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "1.5rem" }}>
          <p style={{ marginBottom: 16, color: "#666" }}>Tu saisis une activité pour <strong>{member?.name}</strong></p>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Édition</label>
            <select value={form.edition_id} onChange={e => setForm({ ...form, edition_id: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}>
              {editions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Type d'activité</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Quantité</label>
            <input type="number" min="1" value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} />
          </div>
          <button onClick={handleSubmit} style={{
            width: "100%", padding: 12, borderRadius: 8, border: "none",
            background: "#222", color: "#fff", fontSize: 16, cursor: "pointer"
          }}>Ajouter l'activité</button>
          {message && <p style={{ textAlign: "center", marginTop: 12, fontWeight: 500 }}>{message}</p>}
        </div>
      )}
    </div>
  )
}