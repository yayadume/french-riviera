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
  "MEXICANA": "/mexicana.png",
  "CRACK": "/crack.png",
  "CARTE PP": "/carte-pp.png",
  "BRANCHE": "/branche.png"
}

const DROGUES_LIST = ["HERO","SPOREX","TRANQ","PURPLE","MEXICANA","COKE","CARTE PP","CRACK","WEED","METH","ECSTASY","B MAGIC"]
const TYPES = ["vente","Plantation","Apu","Cambu","Go fast","Atm","Armu","Fleeca","Prison"]
const MEDALS = ["🥇","🥈","🥉"]

const s = (obj) => Object.assign({}, obj)

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
  const [form, setForm] = useState({ member_id: "", semaine_id: "", type: "vente", drogue: "", quantity: 1, date_heure: new Date().toISOString().slice(0,16) })
  const [message, setMessage] = useState("")
  const [newMember, setNewMember] = useState("")
const [stocks, setStocks] = useState([])
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
      drogue: ["vente","Plantation"].includes(form.type) ? form.drogue : null,
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
          <img src="/frenchriviera.png" alt="FR" style={{ height: 70, objectFit: "contain" }} />
          <div style={{ marginTop: 10, fontSize: 11, color: COLORS.gold, letterSpacing: "0.1em", textTransform: "uppercase" }}>{member?.name}</div>
          {isAdmin && <div style={{ fontSize: 10, background: COLORS.gold, color: "#0a1628", borderRadius: 4, padding: "2px 8px", display: "inline-block", marginTop: 4, fontWeight: 700 }}>ADMIN</div>}
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

        <div style={{ padding: "1rem", borderTop: `1px solid ${COLORS.border}` }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: "1.5rem" }}>
              {statCard("Points totaux", myScores?.points ?? 0, COLORS.gold)}
              {statCard("Salaire semaine", `${Math.round(mySalaire?.salaire_total ?? 0).toLocaleString()} $`, COLORS.success)}
              {statCard("Activités semaine", myActivities.length)}
            </div>
            {card(
              <>
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
              </>
            )}
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
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: "1.5rem" }}>
              {[{n:"DUME",r:"Chef"},{n:"JORDAN",r:"Capo"}].map(({n,r}) => (
                <div key={n} style={{ background: `${COLORS.blue}88`, border: `2px solid ${COLORS.gold}`, borderRadius: 12, padding: "20px 32px", minWidth: 130 }}>
                  <div style={{ fontSize: 32 }}>👑</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.gold, marginTop: 8 }}>{n}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{r}</div>
                </div>
              ))}
            </div>
            <div style={{ width: 2, height: 30, background: COLORS.border, margin: "0 auto" }} />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <div style={{ background: `${COLORS.blue}44`, border: `2px solid ${COLORS.blueLight}`, borderRadius: 12, padding: "20px 32px", minWidth: 130 }}>
                <div style={{ fontSize: 32 }}>🥈</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginTop: 8 }}>CIRO</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Sous Capo</div>
              </div>
            </div>
            <div style={{ width: 2, height: 30, background: COLORS.border, margin: "0 auto" }} />
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Soldats</div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              {["PARKER","TONY","MARTINO","MAMADE","DON","KYKY","NEXYO","JON","JASON"].map(n => (
                <div key={n} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 20px", minWidth: 100 }}>
                  <div style={{ fontSize: 24 }}>⚔️</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, marginTop: 6 }}>{n}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Soldat</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEMBRES */}
        {page === "membres" && (
          <div>
            <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Membres</h2>
            {members.map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", marginBottom: 8, borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.card }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: COLORS.gold }}>{m.name[0]}</div>
                <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
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
                {select(form.semaine_id, v => setForm({...form, semaine_id: v}),
                  semaines.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Type d'activité</label>
                {select(form.type, v => setForm({...form, type: v, drogue: ""}),
                  TYPES.map(t => <option key={t} value={t}>{t}</option>)
                )}
              </div>
              {["vente","Plantation"].includes(form.type) && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Drogue</label>
                  {select(form.drogue, v => setForm({...form, drogue: v}),
                    [<option key="" value="">-- Choisir --</option>, ...DROGUES_LIST.map(d => <option key={d} value={d}>{d}</option>)]
                  )}
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Quantité</label>
                {input(form.quantity, v => setForm({...form, quantity: v}), "number")}
              </div>
              <div style={{ marginBottom: 20 }}>
  <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Date & heure</label>
  <input type="datetime-local" value={form.date_heure}
    onChange={e => setForm({...form, date_heure: e.target.value})}
    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, boxSizing: "border-box", fontSize: 14 }} />
</div>
              {goldBtn("Ajouter l'activité", handleSubmit, { width: "100%" })}
              {message && <p style={{ textAlign: "center", marginTop: 12, color: message.includes("✅") ? COLORS.success : COLORS.danger }}>{message}</p>}
            </>)}
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
              {members.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                  <button onClick={() => handleDeleteMember(m.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: COLORS.danger, color: "#fff", cursor: "pointer", fontSize: 12 }}>Supprimer</button>
                </div>
              ))}
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
                await supabase.from("semaines").insert([{
                  nom: `Semaine ${semaines.length + 1}`,
                  debut: debut.toISOString(),
                  fin: fin.toISOString(),
                  active: true
                }])
                loadData()
              }, { marginTop: 12 })}
            </>)}
          </div>
        )}
{/* STOCK */}
{page === "stock" && (
  <div>
    <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Stock</h2>

    {isAdmin && card(<>
      <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>Ajouter / Retirer du stock</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Coffre</label>
          {select(stockForm.coffre_id, v => setStockForm({...stockForm, coffre_id: v}),
            [<option key="" value="">-- Choisir --</option>, ...coffres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)]
          )}
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Action</label>
          {select(stockForm.action, v => setStockForm({...stockForm, action: v}), [
            <option key="depose" value="depose">Déposer</option>,
            <option key="retire" value="retire">Retirer</option>
          ])}
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Item</label>
          {input(stockForm.item, v => setStockForm({...stockForm, item: v}), "text", "Ex: COKE, AK47...")}
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Quantité</label>
          {input(stockForm.quantite, v => setStockForm({...stockForm, quantite: v}), "number")}
        </div>
      </div>
      {goldBtn("Valider", handleAddStock, { width: "100%" })}
      {message && <p style={{ textAlign: "center", marginTop: 12, color: message.includes("✅") ? COLORS.success : COLORS.danger }}>{message}</p>}
    </>, { marginBottom: 20 })}

    {/* Affichage stock par coffre */}
    {["Coffre 29", "Coffre 52"].map(nom => {
      const items = stocks.filter(s => s.coffre === nom)
      return (
        <div key={nom} style={{ marginBottom: 20 }}>
          {card(<>
            <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>📦 {nom}</h3>
            {items.length === 0
              ? <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Aucun item en stock.</p>
              : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: COLORS.blue }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.gold }}>Item</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", color: COLORS.gold }}>Quantité</th>
                    </tr>
                  </thead>
                <tbody>
  {items.map((s, i) => (
    <tr key={s.item} style={{ background: i % 2 === 0 ? COLORS.card : COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
      <td style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {ITEM_IMAGES[s.item.toUpperCase()]
            ? <img src={ITEM_IMAGES[s.item.toUpperCase()]} alt={s.item} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 6, background: "#0a1628", padding: 4 }} />
            : <div style={{ width: 40, height: 40, borderRadius: 6, background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>
          }
          <span>{s.item}</span>
        </div>
      </td>
      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: COLORS.success }}>{s.quantite}</td>
    </tr>
  ))}
</tbody>
                </table>
            }
          </>)}
        </div>
      )
    })}
  </div>
)}
      </div>
    </div>
  )
}