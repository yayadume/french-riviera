import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export default function App() {
  const [session, setSession] = useState(null)
  const [member, setMember] = useState(null)
  const [scores, setScores] = useState([])
  const [editions, setEditions] = useState([])
  const [members, setMembers] = useState([])
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
    supabase.from("members").select("*").then(({ data }) => setMembers(data))
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
  const types = ["vente", "Plantation", "Apu", "Cambu", "Go fast", "Atm", "Armu", "Fleeca", "Prison"]
const drogues = ["HERO", "SPOREX", "TRANQ", "PURPLE", "MEXICANA", "COKE", "CARTE PP", "CRACK", "WEED", "METH", "ECSTASY"]

  const navBtn = (label, target) => (
    <button onClick={() => setPage(target)} style={{
      padding: "8px 24px", borderRadius: 8, border: "1px solid #555", cursor: "pointer",
      background: page === target ? "#fff" : "transparent",
      color: page === target ? "#111" : "#fff", fontWeight: 500
    }}>{label}</button>
  )

  const editionBtn = (e) => (
    <button key={e.id} onClick={() => setEditionId(e.id)} style={{
      padding: "6px 16px", borderRadius: 8, border: "1px solid #555", cursor: "pointer",
      background: editionId === e.id ? "#fff" : "transparent",
      color: editionId === e.id ? "#111" : "#fff"
    }}>{e.name}</button>
  )

  if (!session) return (
    <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ width: 380, background: "#1a1a1a", borderRadius: 16, padding: "2rem", border: "1px solid #333" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <img src="/logo.png" alt="French Riviera" style={{ height: 70, objectFit: "contain" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: "#ccc" }}>Email</label>
          <input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#222", color: "#fff", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: "#ccc" }}>Mot de passe</label>
          <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#222", color: "#fff", boxSizing: "border-box" }} />
        </div>
        {loginError && <p style={{ color: "#f87171", textAlign: "center", marginBottom: 12 }}>{loginError}</p>}
        <button onClick={handleLogin} style={{
          width: "100%", padding: 12, borderRadius: 8, border: "none",
          background: "#fff", color: "#111", fontSize: 16, cursor: "pointer", fontWeight: 600
        }}>Se connecter</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#111", fontFamily: "sans-serif", color: "#fff" }}>

      {/* HEADER */}
      <div style={{ background: "#1a1a1a", borderBottom: "1px solid #333", padding: "12px 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="/logo.png" alt="French Riviera" style={{ height: 44, objectFit: "contain" }} />
        <div style={{ display: "flex", gap: 8 }}>
          {navBtn("Classement", "classement")}
          {navBtn("Membres", "membres")}
          {navBtn("Saisir activité", "saisie")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#aaa", fontSize: 14 }}>👤 {member?.name}</span>
          <button onClick={() => supabase.auth.signOut()} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid #555",
            background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13
          }}>Déconnexion</button>
        </div>
      </div>

      {/* CONTENU */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>

        {page === "classement" && <>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: "1.5rem" }}>
            {editions.map(e => editionBtn(e))}
          </div>
          {scores.length === 0
  ? <p style={{ textAlign: "center", color: "#666" }}>Aucune activité pour cette édition.</p>
  : <>
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#222", color: "#aaa" }}>
            <th style={{ padding: "10px 8px", textAlign: "left" }}>Rang</th>
            <th style={{ padding: "10px 8px", textAlign: "left" }}>Membre</th>
            <th style={{ padding: "10px 8px", textAlign: "center", color: "#4ade80" }}>Points</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>🌿 Plant.</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>💊 Vente</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>🏠 Cambu</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>🏧 ATM</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>🚔 APU</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>🚗 Go fast</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>⛓️ Prison</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>🚛 Armu</th>
            <th style={{ padding: "10px 8px", textAlign: "center" }}>🏦 Fleeca</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={s.member_id} style={{ background: i === 0 ? "#2a2510" : i % 2 === 0 ? "#1a1a1a" : "#161616", borderBottom: "1px solid #222" }}>
              <td style={{ padding: "10px 8px", textAlign: "left" }}>
                {i < 3 ? medals[i] : `#${i + 1}`}
              </td>
              <td style={{ padding: "10px 8px", fontWeight: 600 }}>{s.member_name}</td>
              <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 700, color: "#4ade80" }}>{s.points}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{s.plantation}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{s.vente}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{s.cambu}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{s.atm}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{s.apu}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{s.go_fast}</td>
              <td style={{ padding: "10px 8px", textAlign: "center", color: s.prison > 0 ? "#f87171" : "#fff" }}>{s.prison}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{s.armu}</td>
              <td style={{ padding: "10px 8px", textAlign: "center" }}>{s.fleeca}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
}
        </>}

        {page === "membres" && (
          <div>
            <h2 style={{ marginBottom: "1rem" }}>Membres du groupe</h2>
            {members.map((m, i) => (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 20px", marginBottom: 8, borderRadius: 10,
                border: "1px solid #333", background: "#1a1a1a"
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: "#333",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14
                }}>{m.name[0]}</div>
                <span style={{ flex: 1, fontWeight: 500 }}>{m.name}</span>
                <span style={{ fontSize: 12, color: m.active ? "#4ade80" : "#f87171" }}>
                  {m.active ? "✅ Actif" : "❌ Inactif"}
                </span>
              </div>
            ))}
          </div>
        )}

        {page === "saisie" && (
          <div style={{ background: "#1a1a1a", borderRadius: 12, padding: "1.5rem", border: "1px solid #333" }}>
            <p style={{ marginBottom: 16, color: "#aaa" }}>Tu saisis une activité pour <strong style={{ color: "#fff" }}>{member?.name}</strong></p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: "#ccc" }}>Édition</label>
              <select value={form.edition_id} onChange={e => setForm({ ...form, edition_id: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#222", color: "#fff" }}>
                {editions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
  <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: "#ccc" }}>Type d'activité</label>
  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, drogue: "" })}
    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#222", color: "#fff" }}>
    {types.map(t => <option key={t} value={t}>{t}</option>)}
  </select>
</div>

{form.type === "vente" && (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: "#ccc" }}>Drogue vendue</label>
    <select value={form.drogue || ""} onChange={e => setForm({ ...form, drogue: e.target.value })}
      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#222", color: "#fff" }}>
      <option value="">-- Choisir --</option>
      {drogues.map(d => <option key={d} value={d}>{d}</option>)}
    </select>
  </div>
)}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: "#ccc" }}>Quantité</label>
              <input type="number" min="1" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#222", color: "#fff", boxSizing: "border-box" }} />
            </div>
            <button onClick={handleSubmit} style={{
              width: "100%", padding: 12, borderRadius: 8, border: "none",
              background: "#fff", color: "#111", fontSize: 16, cursor: "pointer", fontWeight: 600
            }}>Ajouter l'activité</button>
            {message && <p style={{ textAlign: "center", marginTop: 12, fontWeight: 500 }}>{message}</p>}
          </div>
        )}
      </div>
    </div>
  )
}