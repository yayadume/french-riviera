import { useEffect, useState } from "react"
import { supabase } from "./supabase"

const COLORS = {
  bg: "#050d1a",
  sidebar: "#080f1f",
  card: "#0d1b2e",
  border: "#1a2d4a",
  gold: "#c9a84c",
  goldLight: "#e8c97a",
  blue: "#1a3a6b",
  blueLight: "#2a5298",
  text: "#e8eaf0",
  textMuted: "#6b7fa3",
  success: "#4ade80",
  danger: "#f87171",
  warning: "#fbbf24"
}

const ITEM_IMAGES = {
  "METH": "/meth.png",
  "TRANQ": "/tranq.png",
  "POCHON DE MEXICANA": "/mexicana.png",
  "CANNABIS": "/Cannabis.png",
  "CRACK": "/crack.png",
  "CARTE PP": "/carte-pp.png",
  "BRANCHE": "/branche.png"
}
const MEMBER_PHOTOS = {
  "DUME": "/dume.png",
  "JORDAN": "/jordan.png",
  "CIRO": "/ciro.png",
  "TONY": "/tony.png",
  "PARKER": "/parker.png",
  "MARTINO": "/martino.png",
  "MAMADE": "/mamade.png"
}

const DROGUES_LIST = ["HERO","SPOREX","TRANQ","PURPLE","MEXICANA","COKE","CARTE PP","CRACK","WEED","METH","ECSTASY","B MAGIC"]
const TYPES = ["vente","Plantation","Apu","Cambu","Go fast","Atm","Armu","Fleeca","Prison"]
const MEDALS = ["🥇","🥈","🥉"]
const ACTION_TYPES = ["Atm","Apu","Cambu","Go fast"]

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
        {time.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [member, setMember] = useState(null)
  const [page, setPage] = useState("dashboard")
  const [members, setMembers] = useState([])
  const [semaines, setSemaines] = useState([])
  const [semaine, setSemaine] = useState(null)
  const [scores, setScores] = useState([])
  const [salaires, setSalaires] = useState([])
  const [activities, setActivities] = useState([])
  const [drogues, setDrogues] = useState([])
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [form, setForm] = useState({ member_id: "", semaine_id: "", type: "vente", drogue: "", quantity: 1, date_heure: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) })
  const [message, setMessage] = useState("")
  const [newMember, setNewMember] = useState("")
  const [quotas, setQuotas] = useState({ actions: 24, plantations: 108, ventes: 600 })
  const [stocks, setStocks] = useState([])
  const [stockCamera, setStockCamera] = useState([])
  const [coffres, setCoffres] = useState([])
  const [stockForm, setStockForm] = useState({ coffre_id: "", item: "", quantite: 1, action: "depose" })

  const isAdmin = member?.name === "DUME"

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_e, s) => setSession(s))
  }, [])

  useEffect(() => {
    if (!session) return
    supabase.from("members").select("*").eq("user_id", session.user.id).single().then(({ data }) => setMember(data))
    loadData()
    const channel = supabase
      .channel("stock-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_items" }, () => { loadData() })
      .on("postgres_changes", { event: "*", schema: "public", table: "camera_events" }, () => { loadData() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session])

  useEffect(() => {
    if (!semaine) return
    supabase.from("scores").select("*").then(({ data }) => setScores(data || []))
    supabase.from("salaires").select("*").eq("semaine_id", semaine.id).then(({ data }) => setSalaires(data || []))
    supabase.from("activities").select("*").eq("semaine_id", semaine.id).order("created_at", { ascending: false }).then(({ data }) => setActivities(data || []))
  }, [semaine])

  const loadData = async () => {
    const { data: s } = await supabase.from("semaines").select("*").order("debut", { ascending: false })
    setSemaines(s || [])
    const active = s?.find(x => x.active) || s?.[0]
    setSemaine(active)
    setForm(f => ({ ...f, semaine_id: active?.id || "" }))
    const { data: m } = await supabase.from("members").select("*").order("name")
    setMembers(m || [])
    const { data: d } = await supabase.from("drogues").select("*").order("nom")
    setDrogues(d || [])
    const { data: c } = await supabase.from("coffres").select("*").order("nom")
    setCoffres(c || [])
    const { data: st } = await supabase.from("stock_actuel").select("*")
    setStocks(st || [])
    const { data: sc } = await supabase.from("stock_camera").select("*")
    setStockCamera(sc || [])
    const { data: q } = await supabase.from("quotas").select("*").single()
    if (q) setQuotas(q)
  }

  const handleLogin = async () => {
    setLoginError("")
    const { error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password })
    if (error) setLoginError("Email ou mot de passe incorrect")
  }

  const handleSubmit = async () => {
    const targetId = isAdmin ? parseInt(form.member_id) : member?.id
    if (!targetId) return setMessage("❌ Sélectionne un membre")
    const { error } = await supabase.from("activities").insert([{
      member_id: targetId,
      semaine_id: parseInt(form.semaine_id),
      type: form.type,
      drogue: form.type === "vente" ? form.drogue : null,
      quantity: parseInt(form.quantity),
      created_at: new Date(form.date_heure).toISOString()
    }])
    if (error) setMessage("❌ Erreur : " + error.message)
    else {
      setMessage("✅ Activité ajoutée !")
      loadData()
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleAddMember = async () => {
    if (!newMember.trim()) return
    await supabase.from("members").insert([{ name: newMember.toUpperCase(), active: true }])
    setNewMember("")
    loadData()
  }

  const handleDeleteMember = async (id) => {
    if (!confirm("Supprimer ce membre ?")) return
    await supabase.from("members").delete().eq("id", id)
    loadData()
  }

  const handleChangeGrade = async (id, grade) => {
    await supabase.from("members").update({ grade }).eq("id", id)
    loadData()
  }

  const handleAddStock = async () => {
    if (!stockForm.coffre_id || !stockForm.item || !stockForm.quantite) return setMessage("❌ Remplis tous les champs")
    const { error } = await supabase.from("stock_items").insert([{
      coffre_id: parseInt(stockForm.coffre_id),
      item: stockForm.item,
      quantite: parseInt(stockForm.quantite),
      action: stockForm.action
    }])
    if (error) setMessage("❌ Erreur : " + error.message)
    else {
      setMessage("✅ Stock mis à jour !")
      loadData()
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const myScores = scores.find(s => s.member_id === member?.id)
  const mySalaire = salaires.find(s => s.member_id === member?.id)
  const myActivities = activities.filter(a => a.member_id === member?.id).slice(0, 5)
  const myVentes = activities.filter(a => a.member_id === member?.id && a.type === "vente").reduce((sum, a) => sum + a.quantity, 0)
  const totalVentes = activities.filter(a => a.type === "vente").reduce((sum, a) => sum + a.quantity, 0)
  const myPlantations = activities.filter(a => a.member_id === member?.id && a.type === "Plantation").reduce((sum, a) => sum + a.quantity, 0)
  const totalPlantations = activities.filter(a => a.type === "Plantation").reduce((sum, a) => sum + a.quantity, 0)
  const myActions = activities.filter(a => a.member_id === member?.id && ACTION_TYPES.includes(a.type)).reduce((sum, a) => sum + a.quantity, 0)
  const totalActions = activities.filter(a => ACTION_TYPES.includes(a.type)).reduce((sum, a) => sum + a.quantity, 0)

  const input = (val, onChange, type = "text", placeholder = "") => (
    <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, boxSizing: "border-box", fontSize: 14 }} />
  )

  const select = (val, onChange, options) => (
    <select value={val} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, fontSize: 14 }}>
      {options}
    </select>
  )

  const card = (children, style = {}) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1.25rem", ...style }}>
      {children}
    </div>
  )

  const statCard = (label, value, color = COLORS.gold) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  )

  const goldBtn = (label, onClick, style = {}) => (
    <button onClick={onClick} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight})`, color: "#0a1628", fontWeight: 700, cursor: "pointer", fontSize: 14, ...style }}>{label}</button>
  )

  const statFraction = (label, value, total, color = COLORS.gold) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value} <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 400 }}>/ {total}</span></div>
    </div>
  )

  if (!session) return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ width: 400, background: COLORS.card, borderRadius: 20, padding: "2.5rem", border: `1px solid ${COLORS.border}` }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/frenchriviera.png" alt="French Riviera" style={{ height: 120, objectFit: "contain" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Email</label>
          {input(loginForm.email, v => setLoginForm({ ...loginForm, email: v }), "email")}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Mot de passe</label>
          {input(loginForm.password, v => setLoginForm({ ...loginForm, password: v }), "password")}
        </div>
        {loginError && <p style={{ color: COLORS.danger, textAlign: "center", marginBottom: 14, fontSize: 13 }}>{loginError}</p>}
        {goldBtn("Se connecter", handleLogin, { width: "100%", padding: 14, fontSize: 16 })}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "sans-serif", color: COLORS.text, display: "flex", width: "100%" }}>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: COLORS.sidebar, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 10 }}>
        <div style={{ padding: "1.5rem 1rem", borderBottom: `1px solid ${COLORS.border}`, textAlign: "center" }}>
  {MEMBER_PHOTOS[member?.name]
    ? <img src={MEMBER_PHOTOS[member?.name]} alt={member?.name} style={{ width: 90, height: 90, objectFit: "cover", objectPosition: "center top", borderRadius: "50%", border: `2px solid ${COLORS.gold}` }} />
    : <div style={{ width: 90, height: 90, borderRadius: "50%", background: COLORS.blue, border: `2px solid ${COLORS.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto" }}>👤</div>
  }
  <div style={{ marginTop: 10, fontSize: 11, color: COLORS.gold, letterSpacing: "0.1em", textTransform: "uppercase" }}>{member?.name}</div>
  {isAdmin && <div style={{ fontSize: 10, background: COLORS.gold, color: "#0a1628", borderRadius: 4, padding: "2px 8px", display: "inline-block", marginTop: 4, fontWeight: 700 }}>ADMIN</div>}
  <Clock />
</div>
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          {[
            { id: "dashboard", icon: "🏠", label: "Tableau de bord" },
            { id: "classement", icon: "🏆", label: "Classement" },
            { id: "salaires", icon: "💰", label: "Salaires" },
            { id: "hierarchie", icon: "👑", label: "Hiérarchie" },
            { id: "membres", icon: "👥", label: "Membres" },
            { id: "stock", icon: "📦", label: "Stock" },
            { id: "saisie", icon: "✏️", label: "Saisir activité" },
            ...(isAdmin ? [{ id: "admin", icon: "⚙️", label: "Administration" }] : [])
          ].map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              width: "100%", padding: "12px 20px", border: "none", background: page === item.id ? `${COLORS.blue}88` : "transparent",
              color: page === item.id ? COLORS.gold : COLORS.textMuted, textAlign: "left", cursor: "pointer", fontSize: 14,
              borderLeft: page === item.id ? `3px solid ${COLORS.gold}` : "3px solid transparent",
              display: "flex", alignItems: "center", gap: 10
            }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
  <img src="/frenchriviera.png" alt="FR" style={{ height: 80, objectFit: "contain" }} />
</div>
<div style={{ padding: "1rem", borderTop: `1px solid ${COLORS.border}` }}>
  <button onClick={async () => {
    const newPwd = prompt("Nouveau mot de passe (6 caractères min) :")
    if (!newPwd) return
    if (newPwd.length < 6) return alert("❌ Trop court, minimum 6 caractères.")
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) alert("❌ Erreur : " + error.message)
    else alert("✅ Mot de passe mis à jour !")
  }} style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13, marginBottom: 8 }}>
    🔑 Changer mot de passe
  </button>
  <button onClick={() => supabase.auth.signOut()} style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}>
    Déconnexion
  </button>
</div>
      </div>

      {/* CONTENU */}
      <div style={{ marginLeft: 220, flex: 1, padding: "2rem" }}>

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div>
            <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Tableau de bord — {member?.name}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: "1.5rem" }}>
              {statFraction("Nombre de ventes", myVentes, totalVentes)}
              {statFraction("Nombre de plantations", myPlantations, totalPlantations)}
              {statFraction("Actions", myActions, totalActions)}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Salaire</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.success }}>
                  {Math.round(mySalaire?.salaire_total ?? 0).toLocaleString()} $
                  <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 400 }}> / {Math.round(salaires.reduce((sum, s) => sum + (s.salaire_total ?? 0), 0)).toLocaleString()} $</span>
                </div>
              </div>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Points</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.gold }}>
                  {myScores?.points ?? 0}
                  <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 400 }}> / {scores.filter(s => s.semaine_id === semaine?.id).reduce((sum, s) => sum + (s.points ?? 0), 0)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {card(<>
                <h3 style={{ color: COLORS.gold, marginBottom: 16, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>Disponibilités actions</h3>
                {[
                  { type: "Atm", label: "ATM", cooldown: 3 },
                  { type: "Apu", label: "APU", cooldown: 2 },
                  { type: "Cambu", label: "CAMBU", cooldown: 3 },
                  { type: "Go fast", label: "GO FAST", cooldown: 24 }
                ].map(({ type, label, cooldown }) => {
                  const last = activities.filter(a => a.member_id === member?.id && a.type === type).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                  const now = new Date()
                  const lastDate = last ? new Date(last.created_at) : null
                  const diffH = lastDate ? (now - lastDate) / 3600000 : null
                  const available = !lastDate || diffH >= cooldown
                  const remaining = lastDate && !available ? cooldown - diffH : 0
                  const remainH = Math.floor(remaining)
                  const remainM = Math.floor((remaining - remainH) * 60)
                  return (
                    <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                          {lastDate ? `Dernière : ${lastDate.toLocaleDateString('fr-FR')} ${lastDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : "Jamais effectué"}
                        </div>
                      </div>
                      {available
                        ? <span style={{ color: COLORS.success, fontSize: 13, fontWeight: 600 }}>✓ Disponible</span>
                        : <span style={{ color: COLORS.warning, fontSize: 13, fontWeight: 600 }}>⏳ {remainH}h {remainM}m</span>
                      }
                    </div>
                  )
                })}
              </>)}

              {card(<>
                <h3 style={{ color: COLORS.gold, marginBottom: 16, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quotas de la semaine</h3>
                {[
                  { label: "Actions effectuées", value: myActions, total: quotas.actions, color: COLORS.gold },
                  { label: "Plantations", value: myPlantations, total: quotas.plantations, color: "#4ade80" },
                  { label: "Ventes", value: myVentes, total: quotas.ventes, color: "#60a5fa" }
                ].map(({ label, value, total, color }) => {
                  const pct = Math.min(Math.round((value / total) * 100), 100)
                  return (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: COLORS.textMuted }}>{label}</span>
                        <span style={{ color, fontWeight: 600 }}>{value} / {total}</span>
                      </div>
                      <div style={{ background: "#0a1628", borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  )
                })}
              </>)}
            </div>

            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 12, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dernières activités</h3>
              {myActivities.length === 0
                ? <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Aucune activité cette semaine.</p>
                : myActivities.map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 14 }}>
                    <span style={{ color: COLORS.gold }}>{a.type}</span>
                    {a.drogue && <span style={{ color: COLORS.textMuted }}>{a.drogue}</span>}
                    <span>×{a.quantity}</span>
                    <span style={{ color: COLORS.textMuted, fontSize: 12 }}>
                      {new Date(a.created_at).toLocaleDateString('fr-FR')} {new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button onClick={async () => {
                      if (!confirm("Supprimer cette activité ?")) return
                      await supabase.from("activities").delete().eq("id", a.id)
                      loadData()
                    }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: COLORS.danger, color: "#fff", cursor: "pointer", fontSize: 11 }}>✕</button>
                  </div>
                ))
              }
            </>)}
          </div>
        )}

        {/* CLASSEMENT */}
        {page === "classement" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ color: COLORS.gold, margin: 0 }}>Classement</h2>
              <select value={semaine?.id || ""} onChange={e => { const s = semaines.find(x => x.id === parseInt(e.target.value)); setSemaine(s) }}
                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.card, color: COLORS.text }}>
                {semaines.map(s => <option key={s.id} value={s.id}>{s.nom}{s.active ? " (en cours)" : ""}</option>)}
              </select>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.blue }}>
                    {["Rang","Membre","Points","🌿 Plant.","💊 Vente","🏠 Cambu","🏧 ATM","🚔 APU","🚗 Go fast","⛓️ Prison","🚛 Armu","🏦 Fleeca"].map(h => (
                      <th key={h} style={{ padding: "12px 10px", textAlign: h === "Rang" || h === "Membre" ? "left" : "center", color: COLORS.gold, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scores.filter(s => s.semaine_id === semaine?.id).sort((a,b) => b.points - a.points).map((s, i) => (
                    <tr key={s.member_id} style={{ background: s.member_id === member?.id ? `${COLORS.blue}44` : i % 2 === 0 ? COLORS.card : COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "12px 10px" }}>{i < 3 ? MEDALS[i] : `#${i+1}`}</td>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: s.member_id === member?.id ? COLORS.gold : COLORS.text }}>{s.member_name}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700, color: COLORS.gold }}>{s.points}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>{s.plantation}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>{s.vente}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>{s.cambu}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>{s.atm}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>{s.apu}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>{s.go_fast}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center", color: s.prison > 0 ? COLORS.danger : COLORS.text }}>{s.prison}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>{s.armu}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>{s.fleeca}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SALAIRES */}
        {page === "salaires" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ color: COLORS.gold }}>Salaires</h2>
              <select value={semaine?.id || ""} onChange={e => { const s = semaines.find(x => x.id === parseInt(e.target.value)); setSemaine(s) }}
                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.card, color: COLORS.text }}>
                {semaines.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.blue }}>
                    {["Membre","Salaire Ventes","Salaire Plantations","Total"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: h === "Membre" ? "left" : "center", color: COLORS.gold, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaires.sort((a,b) => b.salaire_total - a.salaire_total).map((s, i) => (
                    <tr key={s.member_id} style={{ background: s.member_id === member?.id ? `${COLORS.blue}44` : i % 2 === 0 ? COLORS.card : COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: s.member_id === member?.id ? COLORS.gold : COLORS.text }}>{s.member_name}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>{Math.round(s.salaire_vente).toLocaleString()} $</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>{Math.round(s.salaire_plantation).toLocaleString()} $</td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: COLORS.success }}>{Math.round(s.salaire_total).toLocaleString()} $</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HIERARCHIE */}
        {page === "hierarchie" && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: COLORS.gold, marginBottom: "2rem" }}>Hiérarchie</h2>
            {(() => {
              const gradeOrder = ["Chef","Capo","Sous Capo","Commandant","Lieutenant","Soldat d'élite","Soldat"]
              const gradeIcons = { "Chef": "👑", "Capo": "👑", "Sous Capo": "🥈", "Commandant": "⭐", "Lieutenant": "🎖️", "Soldat d'élite": "🗡️", "Soldat": "⚔️" }
              const gradeColors = {
                "Chef": { bg: `${COLORS.blue}88`, border: COLORS.gold, text: COLORS.gold, sub: "#aaa" },
                "Capo": { bg: `${COLORS.blue}88`, border: COLORS.gold, text: COLORS.gold, sub: "#aaa" },
                "Sous Capo": { bg: `${COLORS.blue}44`, border: COLORS.blueLight, text: COLORS.text, sub: COLORS.textMuted },
                "Commandant": { bg: `${COLORS.blue}33`, border: "#6b7fa3", text: COLORS.text, sub: COLORS.textMuted },
                "Lieutenant": { bg: `${COLORS.blue}22`, border: "#444", text: COLORS.text, sub: COLORS.textMuted },
                "Soldat d'élite": { bg: COLORS.card, border: "#444", text: COLORS.text, sub: COLORS.textMuted },
                "Soldat": { bg: COLORS.card, border: COLORS.border, text: COLORS.text, sub: COLORS.textMuted }
              }
              const grouped = gradeOrder.reduce((acc, g) => {
                const list = members.filter(m => (m.grade || "Soldat") === g)
                if (list.length > 0) acc.push({ grade: g, members: list })
                return acc
              }, [])
              return grouped.map(({ grade, members: gradeMembers }, gi) => {
                const c = gradeColors[grade] || gradeColors["Soldat"]
                const icon = gradeIcons[grade] || "⚔️"
                const isTop = ["Chef","Capo"].includes(grade)
                return (
                  <div key={grade}>
                    {gi > 0 && <div style={{ width: 2, height: 30, background: COLORS.border, margin: "0 auto" }} />}
                    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 4 }}>
                    {gradeMembers.map(m => (
                        <div key={m.id} style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `2px solid ${c.border}`, minWidth: isTop ? 180 : 140, width: isTop ? 180 : 140 }}>
  {MEMBER_PHOTOS[m.name]
    ? <img src={MEMBER_PHOTOS[m.name]} alt={m.name} style={{ width: "100%", height: isTop ? 240 : 180, objectFit: "cover", objectPosition: "center top", display: "block" }} />
    : <div style={{ width: "100%", height: isTop ? 240 : 180, background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isTop ? 56 : 40 }}>{icon}</div>
  }
  <div style={{
    position: "absolute", bottom: 0, left: 0, right: 0,
    background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
    padding: "30px 10px 10px", textAlign: "center"
  }}>
    <div style={{ fontWeight: 700, fontSize: isTop ? 15 : 13, color: "#fff", textShadow: "0 1px 4px #000" }}>{m.name}</div>
    <div style={{ fontSize: 11, color: c.border === COLORS.gold ? COLORS.gold : "#aaa", marginTop: 3, fontWeight: 600 }}>{grade}</div>
  </div>
</div>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}

        {/* MEMBRES */}
        {page === "membres" && (
          <div>
            <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Membres</h2>
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", marginBottom: 8, borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.card }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: COLORS.gold }}>{m.name[0]}</div>
                <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>{m.grade || "Soldat"}</span>
                <span style={{ fontSize: 12, color: m.active ? COLORS.success : COLORS.danger }}>{m.active ? "✅ Actif" : "❌ Inactif"}</span>
              </div>
            ))}
          </div>
        )}

        {/* SAISIE */}
        {page === "saisie" && (
          <div>
            <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Saisir une activité</h2>
            {card(<>
              {isAdmin && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Membre</label>
                  {select(form.member_id, v => setForm({...form, member_id: v}),
                    [<option key="" value="">-- Choisir --</option>, ...members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)]
                  )}
                </div>
              )}
              {!isAdmin && <p style={{ color: COLORS.textMuted, marginBottom: 14, fontSize: 14 }}>Saisie pour <strong style={{ color: COLORS.gold }}>{member?.name}</strong></p>}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Semaine</label>
                {select(form.semaine_id, v => setForm({...form, semaine_id: v}), semaines.map(s => <option key={s.id} value={s.id}>{s.nom}</option>))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Type d'activité</label>
                {select(form.type, v => setForm({...form, type: v, drogue: ""}), TYPES.map(t => <option key={t} value={t}>{t}</option>))}
              </div>
              {form.type === "vente" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Drogue</label>
                  {select(form.drogue, v => setForm({...form, drogue: v}),
                    [<option key="" value="">-- Choisir --</option>, ...DROGUES_LIST.map(d => <option key={d} value={d}>{d}</option>)]
                  )}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Quantité</label>
                {input(form.quantity, v => setForm({...form, quantity: v}), "number")}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Date & heure</label>
                <input type="datetime-local" value={form.date_heure} onChange={e => setForm({...form, date_heure: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, boxSizing: "border-box", fontSize: 14 }} />
              </div>
              {goldBtn("Ajouter l'activité", handleSubmit, { width: "100%" })}
              {message && <p style={{ textAlign: "center", marginTop: 12, color: message.includes("✅") ? COLORS.success : COLORS.danger }}>{message}</p>}
            </>)}
          </div>
        )}

        {/* STOCK */}
{page === "stock" && (
  <div>
    <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Stock</h2>
    {(() => {
      const items = stockCamera.filter(s => s.coffre === "Caméra 29")
      return (
        <div>
          {card(<>
            <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>📦 Coffre 29</h3>
            {items.length === 0
              ? <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Aucun item en stock.</p>
              : <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {items.map(s => (
                  <div key={s.item} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 12px", width: 130, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: COLORS.text, textAlign: "center", textTransform: "uppercase" }}>{s.item}</span>
                    {ITEM_IMAGES[s.item?.toUpperCase()]
                      ? <img src={ITEM_IMAGES[s.item.toUpperCase()]} alt={s.item} style={{ width: 70, height: 70, objectFit: "contain", borderRadius: 8, background: "#0a1628", padding: 6 }} />
                      : <div style={{ width: 70, height: 70, borderRadius: 8, background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📦</div>
                    }
                    <span style={{ fontWeight: 700, fontSize: 22, color: s.quantite > 0 ? COLORS.success : COLORS.danger }}>{s.quantite}</span>
                  </div>
                ))}
              </div>
            }
          </>)}
        </div>
      )
    })()}
  </div>
)}

        {/* ADMIN */}
        {page === "admin" && isAdmin && (
          <div>
            <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Administration</h2>
            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>Ajouter un membre</h3>
              <div style={{ display: "flex", gap: 10 }}>
                {input(newMember, setNewMember, "text", "Nom du membre")}
                {goldBtn("Ajouter", handleAddMember)}
              </div>
            </>, { marginBottom: 16 })}

            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>Gérer les membres</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.blue }}>
                    {["Membre","Email","UID","Grade","Mot de passe","Action"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: COLORS.gold, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? COLORS.card : COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontSize: 12 }}>{m.email || "—"}</td>
                      <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontSize: 11, fontFamily: "monospace" }}>{m.user_id || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <select value={m.grade || "Soldat"} onChange={e => handleChangeGrade(m.id, e.target.value)}
                          style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.text, fontSize: 12, cursor: "pointer" }}>
                          {["Soldat","Soldat d'élite","Lieutenant","Commandant","Sous Capo","Capo","Chef"].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
  <button onClick={async () => {
    if (!m.user_id) return alert("Ce membre n'a pas de compte auth.")
    const newPwd = prompt(`Nouveau mot de passe pour ${m.name} :`)
    if (!newPwd) return
    if (newPwd.length < 6) return alert("❌ Minimum 6 caractères.")
    const res = await fetch("https://npwhfcczhrqgrbtxyaeu.supabase.co/functions/v1/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      body: JSON.stringify({ user_id: m.user_id, password: newPwd })
    })
    if (res.ok) alert(`✅ Mot de passe de ${m.name} mis à jour !`)
    else alert("❌ Erreur lors du changement.")
  }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: COLORS.blueLight, color: "#fff", cursor: "pointer", fontSize: 12, marginRight: 6 }}>🔑 MDP</button>
  <button onClick={() => handleDeleteMember(m.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: COLORS.danger, color: "#fff", cursor: "pointer", fontSize: 12 }}>Supprimer</button>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>, { marginBottom: 16 })}

            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>Quotas de la semaine</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                {[{ key: "actions", label: "Actions" }, { key: "plantations", label: "Plantations" }, { key: "ventes", label: "Ventes" }].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>{label}</label>
                    <input type="number" value={quotas[key]} onChange={e => setQuotas({ ...quotas, [key]: parseInt(e.target.value) })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              {goldBtn("Sauvegarder les quotas", async () => {
                await supabase.from("quotas").update({ actions: quotas.actions, plantations: quotas.plantations, ventes: quotas.ventes }).eq("id", 1)
                setMessage("✅ Quotas mis à jour !")
                setTimeout(() => setMessage(""), 3000)
              })}
              {message && <p style={{ color: COLORS.success, marginTop: 10, fontSize: 13 }}>{message}</p>}
            </>, { marginBottom: 16 })}

            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>Créer une semaine</h3>
              <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Les semaines vont du dimanche 19h au dimanche 19h suivant.</p>
              {goldBtn("Créer semaine suivante", async () => {
                const last = semaines[0]
                if (!last) return
                const debut = new Date(last.fin)
                const fin = new Date(debut)
                fin.setDate(fin.getDate() + 7)
                await supabase.from("semaines").update({ active: false }).eq("active", true)
                await supabase.from("semaines").insert([{ nom: `Semaine ${semaines.length + 1}`, debut: debut.toISOString(), fin: fin.toISOString(), active: true }])
                loadData()
              }, { marginTop: 12 })}
            </>)}
          </div>
        )}

      </div>
    </div>
  )
}