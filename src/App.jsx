import { useEffect, useState } from "react"
import { supabase } from "./supabase"

const COLORS = {
  bg: "#050d1a", sidebar: "#080f1f", card: "#0d1b2e", border: "#1a2d4a",
  gold: "#c9a84c", goldLight: "#e8c97a", blue: "#1a3a6b", blueLight: "#2a5298",
  text: "#e8eaf0", textMuted: "#6b7fa3", success: "#4ade80", danger: "#f87171", warning: "#fbbf24"
}

const ITEM_IMAGES = {
  "METH": "/meth.png", "TRANQ": "/tranq.png", "POCHON DE MEXICANA": "/mexicana.png",
  "CANNABIS": "/Cannabis.png", "CRACK": "/crack.png", "CARTE PP": "/carte-pp.png", "BRANCHE": "/branche.png",
  "ARGENT": "/argent.png", "ARGENT SALE": "/argent sale.png"
}

const MEMBER_PHOTOS = {
  "DUME": "/dume.png", "JORDAN": "/jordan.png", "CIRO": "/ciro.png",
  "TONY": "/tony.png", "PARKER": "/parker.png", "MARTINO": "/martino.png", "MAMADE": "/mamade.png",
  "ASHLEY": "/ashley.png", "DON": "/don.png", "NEXYO": "/nexyo.png"
}

const DROGUES_LIST = ["HERO","SPOREX","TRANQ","PURPLE","MEXICANA","COKE","CARTE PP","CRACK","WEED","METH","ECSTASY","B MAGIC"]
const TYPES = ["vente","Plantation","Apu","Cambu","Go fast","Atm","Armu","Fleeca","Prison"]
const MEDALS = ["🥇","🥈","🥉"]
const ACTION_TYPES = ["Atm","Apu","Cambu","Go fast"]
const EDGE_URL = "https://npwhfcczhrqgrbtxyaeu.supabase.co/functions/v1/change-password"

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
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
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [form, setForm] = useState({ member_id: "", semaine_id: "", type: "vente", drogue: "", quantity: 1, date_heure: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) })
  const [message, setMessage] = useState("")
  const [newMember, setNewMember] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberPassword, setNewMemberPassword] = useState("")
  const [quotas, setQuotas] = useState({ actions: 24, plantations: 108, ventes: 600 })
  const [stockCamera, setStockCamera] = useState([])
  const [drugPrices, setDrugPrices] = useState([])
  const [drugPricesSaving, setDrugPricesSaving] = useState(false)
  const [plantConfig, setPlantConfig] = useState({ prix_graine: 0, prix_pot: 0, nb_branches: 0, prix_branche_vente: 0 })
  const [plantSaving, setPlantSaving] = useState(false)
  const [primeConfig, setPrimeConfig] = useState({ charbon: 25, soldat: 33, haut_grade: 40, meilleur: 50 })
  const [primeSaving, setPrimeSaving] = useState(false)

  const isAdmin = member?.name === "DUME"

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_e, s) => setSession(s))
  }, [])

  useEffect(() => {
    if (!session) return
    supabase.from("members").select("*").eq("user_id", session.user.id).single().then(({ data }) => setMember(data))
    loadData()
    const channel = supabase.channel("realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "camera_events" }, () => loadData())
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
    const { data: sc } = await supabase.from("stock_camera").select("*")
    const { data: sc60 } = await supabase.from("stock_coffre_60").select("*")
    const { data: sc118 } = await supabase.from("stock_coffre_118").select("*")
    const { data: sc24 } = await supabase.from("stock_coffre_24").select("*")
    const { data: sc129 } = await supabase.from("stock_coffre_129").select("*")
    const { data: scv1 } = await supabase.from("stock_coffre_villa1").select("*")
    const { data: scv2 } = await supabase.from("stock_coffre_villa2").select("*")
    setStockCamera([...(sc || []), ...(sc24 || []), ...(sc60 || []), ...(sc118 || []), ...(sc129 || []), ...(scv1 || []), ...(scv2 || [])])
    const { data: q } = await supabase.from("quotas").select("*").single()
    if (q) setQuotas(q)
    const { data: dp } = await supabase.from("drug_prices").select("*").order("drogue")
    setDrugPrices(dp || [])
    const { data: pc } = await supabase.from("plantation_config").select("*").single()
    if (pc) setPlantConfig(pc)
    const { data: pr } = await supabase.from("prime_config").select("*").single()
    if (pr) setPrimeConfig(pr)
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
      member_id: targetId, semaine_id: parseInt(form.semaine_id), type: form.type,
      drogue: form.type === "vente" ? form.drogue : null,
      quantity: parseInt(form.quantity), created_at: new Date(form.date_heure).toISOString()
    }])
    if (error) setMessage("❌ Erreur : " + error.message)
    else { setMessage("✅ Activité ajoutée !"); loadData(); setTimeout(() => setMessage(""), 3000) }
  }

  const handleAddMember = async () => {
    if (!newMember.trim()) return setMessage("❌ Nom requis")
    if (!newMemberEmail.trim()) return setMessage("❌ Email requis")
    const { error } = await supabase.from("members").insert([{
      name: newMember.toUpperCase(), active: true, email: newMemberEmail, grade: "Soldat"
    }])
    if (error) return setMessage("❌ Erreur : " + error.message)
    setNewMember(""); setNewMemberEmail(""); setNewMemberPassword("")
    setMessage(`✅ Membre ${newMember.toUpperCase()} ajouté ! Crée son compte Auth dans Supabase et lie l'UID via SQL.`)
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

  const myScores = scores.find(s => s.member_id === member?.id && s.semaine_id === semaine?.id)
  const mySalaire = salaires.find(s => s.member_id === member?.id)
  const myActivities = activities.filter(a => a.member_id === member?.id).slice(0, 10)
  const myVentes = activities.filter(a => a.member_id === member?.id && a.type === "vente").reduce((sum, a) => sum + a.quantity, 0)
  const totalVentes = activities.filter(a => a.type === "vente").reduce((sum, a) => sum + a.quantity, 0)
  const myPlantations = activities.filter(a => a.member_id === member?.id && a.type === "Plantation").reduce((sum, a) => sum + a.quantity, 0)
  const totalPlantations = activities.filter(a => a.type === "Plantation").reduce((sum, a) => sum + a.quantity, 0)
  const myActions = activities.filter(a => a.member_id === member?.id && ACTION_TYPES.includes(a.type)).reduce((sum, a) => sum + a.quantity, 0)
  const totalActions = activities.filter(a => ACTION_TYPES.includes(a.type)).reduce((sum, a) => sum + a.quantity, 0)

  const inp = (val, onChange, type = "text", placeholder = "") => (
    <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, boxSizing: "border-box", fontSize: 14 }} />
  )

  const sel = (val, onChange, options) => (
    <select value={val} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, fontSize: 14 }}>
      {options}
    </select>
  )

  const card = (children, style = {}) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1.25rem", ...style }}>{children}</div>
  )

  const goldBtn = (label, onClick, style = {}) => (
    <button onClick={onClick} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight})`, color: "#0a1628", fontWeight: 700, cursor: "pointer", fontSize: 14, ...style }}>{label}</button>
  )

  const statFrac = (label, value, total, color = COLORS.gold) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value} <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 400 }}>/ {total}</span></div>
    </div>
  )

  if (!session) return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ width: 400, background: COLORS.card, borderRadius: 20, padding: "2.5rem", border: `1px solid ${COLORS.border}` }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/frenchriviera.png" alt="FR" style={{ height: 120, objectFit: "contain" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Email</label>
          {inp(loginForm.email, v => setLoginForm({ ...loginForm, email: v }), "email")}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Mot de passe</label>
          {inp(loginForm.password, v => setLoginForm({ ...loginForm, password: v }), "password")}
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
              width: "100%", padding: "12px 20px", border: "none",
              background: page === item.id ? `${COLORS.blue}88` : "transparent",
              color: page === item.id ? COLORS.gold : COLORS.textMuted,
              textAlign: "left", cursor: "pointer", fontSize: 14,
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
            const p = prompt("Nouveau mot de passe (6 car. min) :")
            if (!p || p.length < 6) return alert("❌ Trop court.")
            const { error } = await supabase.auth.updateUser({ password: p })
            if (error) alert("❌ " + error.message)
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
            {/* BANNIÈRE */}
            <div style={{ marginBottom: "1.5rem", borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
              <img src="/banniere.png" alt="Bannière" style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "cover" }} />
            </div>

            {/* CLASSEMENT CENTRAL */}
            {(() => {
              const sorted = scores.filter(s => s.semaine_id === semaine?.id).sort((a, b) => b.points - a.points)
              const rang = sorted.findIndex(s => s.member_id === member?.id) + 1
              const total = sorted.length
              const medal = rang === 1 ? "🥇" : rang === 2 ? "🥈" : rang === 3 ? "🥉" : null
              const rangColor = rang === 1 ? COLORS.gold : rang === 2 ? "#c0c0c0" : rang === 3 ? "#cd7f32" : COLORS.text

              // Classement plantations
              const plantParMembre = {}
              activities.forEach(a => {
                if (a.type === "Plantation") plantParMembre[a.member_id] = (plantParMembre[a.member_id] || 0) + a.quantity
              })
              const sortedPlant = Object.entries(plantParMembre).sort((a, b) => b[1] - a[1])
              const rangPlant = sortedPlant.findIndex(([id]) => parseInt(id) === member?.id) + 1
              const medalPlant = rangPlant === 1 ? "🥇" : rangPlant === 2 ? "🥈" : rangPlant === 3 ? "🥉" : null

              // Classement ventes
              const venteParMembre = {}
              activities.forEach(a => {
                if (a.type === "vente") venteParMembre[a.member_id] = (venteParMembre[a.member_id] || 0) + a.quantity
              })
              const sortedVente = Object.entries(venteParMembre).sort((a, b) => b[1] - a[1])
              const rangVente = sortedVente.findIndex(([id]) => parseInt(id) === member?.id) + 1
              const medalVente = rangVente === 1 ? "🥇" : rangVente === 2 ? "🥈" : rangVente === 3 ? "🥉" : null

              const miniCard = (label, rang, medal, icon) => (
                <div style={{ background: `${COLORS.card}`, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 20px", textAlign: "center", minWidth: 120 }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{icon} {label}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {medal && <span style={{ fontSize: 16 }}>{medal}</span>}
                    <span style={{ fontSize: 24, fontWeight: 800, color: rang === 1 ? COLORS.gold : rang === 2 ? "#c0c0c0" : rang === 3 ? "#cd7f32" : COLORS.text }}>
                      {rang > 0 ? `#${rang}` : "—"}
                    </span>
                  </div>
                </div>
              )

              return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: "2rem" }}>
                  {miniCard("Plantations", rangPlant, medalPlant, "🌿")}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.blue}44)`, border: `1px solid ${COLORS.gold}44`, borderRadius: 16, padding: "16px 40px" }}>
                    {medal && <span style={{ fontSize: 40 }}>{medal}</span>}
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Classement semaine</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 48, fontWeight: 800, color: rangColor, lineHeight: 1 }}>#{rang > 0 ? rang : "—"}</span>
                        <span style={{ fontSize: 18, color: COLORS.textMuted, fontWeight: 400 }}>/ {total}</span>
                      </div>
                    </div>
                    {medal && <span style={{ fontSize: 40 }}>{medal}</span>}
                  </div>
                  {miniCard("Ventes", rangVente, medalVente, "💊")}
                </div>
              )
            })()}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: "1.5rem" }}>
              {statFrac("Nombre de ventes", myVentes, totalVentes)}
              {statFrac("Nombre de plantations", myPlantations, totalPlantations)}
              {statFrac("Actions", myActions, totalActions)}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Salaire</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.success }}>
                  {Math.round(mySalaire?.salaire_total ?? 0).toLocaleString()} $
                  <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 400 }}> / {Math.round(salaires.reduce((sum, s) => sum + (s.salaire_total ?? 0), 0)).toLocaleString()} $</span>
                </div>
              </div>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, height: "100%" }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Points</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.gold }}>
                      {myScores?.points ?? 0}
                      <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 400 }}> / {scores.filter(s => s.semaine_id === semaine?.id).reduce((sum, s) => sum + (s.points ?? 0), 0)}</span>
                    </div>
                  </div>
                  <div style={{ borderLeft: `1px solid ${COLORS.border}`, paddingLeft: 12 }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pts Tablette</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#60a5fa" }}>
                      {(() => {
                        const nonCharbon = members.filter(m => (m.grade || "Charbon") !== "Charbon").map(m => m.id)
                        return Math.round(scores.filter(s => s.semaine_id === semaine?.id && nonCharbon.includes(s.member_id)).reduce((sum, s) => sum + (s.points ?? 0), 0))
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {card(<>
                <h3 style={{ color: COLORS.gold, marginBottom: 16, fontSize: 13, textTransform: "uppercase" }}>Disponibilités actions</h3>
                {[
                  { type: "Atm", label: "ATM", cooldown: 3 },
                  { type: "Apu", label: "APU", cooldown: 2 },
                  { type: "Cambu", label: "CAMBU", cooldown: 3 },
                  { type: "Go fast", label: "GO FAST", cooldown: 24 }
                ].map(({ type, label, cooldown }) => {
                  const last = activities.filter(a => a.member_id === member?.id && a.type === type).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                  const lastDate = last ? new Date(last.created_at) : null
                  const diffH = lastDate ? (new Date() - lastDate) / 3600000 : null
                  const available = !lastDate || diffH >= cooldown
                  const remaining = lastDate && !available ? cooldown - diffH : 0
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
                        : <span style={{ color: COLORS.warning, fontSize: 13, fontWeight: 600 }}>⏳ {Math.floor(remaining)}h {Math.floor((remaining - Math.floor(remaining)) * 60)}m</span>
                      }
                    </div>
                  )
                })}
              </>)}
              {card(<>
                <h3 style={{ color: COLORS.gold, marginBottom: 16, fontSize: 13, textTransform: "uppercase" }}>Quotas de la semaine</h3>
                {[
                  { label: "Actions", value: myActions, total: quotas.actions, color: COLORS.gold },
                  { label: "Plantations", value: myPlantations, total: quotas.plantations, color: "#4ade80" },
                  { label: "Ventes", value: myVentes, total: quotas.ventes, color: "#60a5fa" }
                ].map(({ label, value, total, color }) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: COLORS.textMuted }}>{label}</span>
                      <span style={{ color, fontWeight: 600 }}>{value} / {total}</span>
                    </div>
                    <div style={{ background: "#0a1628", borderRadius: 6, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(Math.round((value / total) * 100), 100)}%`, height: "100%", background: color, borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </>)}
            </div>
            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 12, fontSize: 14, textTransform: "uppercase" }}>Dernières activités</h3>
              {myActivities.length === 0
                ? <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Aucune activité cette semaine.</p>
                : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: COLORS.blue }}>
                      {["Type","Drogue","Quantité","Date & heure",""].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: h === "Type" || h === "" ? "left" : "center", color: COLORS.gold, fontWeight: 600, fontSize: 12, borderBottom: `1px solid ${COLORS.border}`, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myActivities.map((a, i) => (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? COLORS.card : COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: "9px 12px", color: COLORS.gold, fontWeight: 600 }}>{a.type}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", color: COLORS.textMuted }}>{a.drogue || "—"}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center" }}>×{a.quantity}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>
                          {new Date(a.created_at).toLocaleDateString('fr-FR')} {new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right" }}>
                          <button onClick={async () => {
                            if (!confirm("Supprimer ?")) return
                            await supabase.from("activities").delete().eq("id", a.id)
                            loadData()
                          }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: COLORS.danger, color: "#fff", cursor: "pointer", fontSize: 11 }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </>)}

            <div style={{ marginBottom: 16 }} />

            {/* BLOC INFOS PRIMES */}
            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 16, fontSize: 14, textTransform: "uppercase" }}>📊 Infos — Primes de la semaine</h3>
              {(() => {
                // Marge nette plantation par plantation
                const coutPlant = (plantConfig.prix_graine ?? 0) + (plantConfig.prix_pot ?? 0)
                const recettePlant = (plantConfig.nb_branches ?? 0) * (plantConfig.prix_branche_vente ?? 0)
                const margeNetPlant = (recettePlant - coutPlant) * 0.70

                // Meilleur planteur et vendeur
                const plantParMembre = {}
                const venteParMembre = {}
                activities.forEach(a => {
                  if (a.type === "Plantation") plantParMembre[a.member_id] = (plantParMembre[a.member_id] || 0) + a.quantity
                  if (a.type === "vente") venteParMembre[a.member_id] = (venteParMembre[a.member_id] || 0) + a.quantity
                })
                const maxPlant = Math.max(0, ...Object.values(plantParMembre))
                const maxVente = Math.max(0, ...Object.values(venteParMembre))
                const isMeilleurPlanteur = myPlantations > 0 && plantParMembre[member?.id] === maxPlant
                const isMeilleurVendeur = myVentes > 0 && venteParMembre[member?.id] === maxVente

                // Colonnes de grades
                const cols = [
                  { key: "charbon", label: "Charbon", pct: primeConfig.charbon, color: "#9ca3af" },
                  { key: "soldat", label: "Soldat", pct: primeConfig.soldat, color: COLORS.text },
                  { key: "haut_grade", label: "Haut gradé", pct: primeConfig.haut_grade, color: COLORS.gold },
                  { key: "meilleur", label: "Top 1 🏆", pct: primeConfig.meilleur, color: COLORS.success },
                ]

                // Lignes : plantation + drogues
                const lignes = [
                  { label: "🌿 Plantation", beneficeNet: margeNetPlant, isMeilleurTop: isMeilleurPlanteur, qty: myPlantations },
                  ...drugPrices.map(dp => ({
                    label: `💊 ${dp.drogue}`,
                    beneficeNet: (dp.prix_vente ?? 0) - (dp.prix_achat ?? 0),
                    isMeilleurTop: isMeilleurVendeur,
                    qty: activities.filter(a => a.member_id === member?.id && a.type === "vente" && a.drogue === dp.drogue).reduce((s, a) => s + a.quantity, 0)
                  }))
                ]

                const thStyle = { padding: "9px 12px", textAlign: "center", color: COLORS.gold, fontWeight: 600, fontSize: 12, borderBottom: `1px solid ${COLORS.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }

                return (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: COLORS.blue }}>
                        <th style={{ ...thStyle, textAlign: "left" }}>Produit</th>
                        {cols.map(c => (
                          <th key={c.key} style={{ ...thStyle, color: c.color }}>{c.label}<br /><span style={{ fontSize: 11, fontWeight: 400 }}>{c.pct}%</span></th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.map((l, i) => {
                        const isPlant = i === 0
                        const bg = isPlant ? COLORS.card : i % 2 === 0 ? COLORS.card : COLORS.bg
                        return (
                          <tr key={l.label} style={{ background: bg, borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: "9px 12px", fontWeight: 600, color: isPlant ? "#4ade80" : COLORS.text }}>{l.label}</td>
                            {cols.map(c => {
                              const prime = l.beneficeNet > 0 ? Math.round(l.qty * l.beneficeNet * (c.pct / 100)) : 0
                              const primeUnit = l.beneficeNet > 0 ? Math.round(l.beneficeNet * (c.pct / 100)) : 0
                              return (
                                <td key={c.key} style={{ padding: "9px 12px", textAlign: "center" }}>
                                  {l.beneficeNet > 0
                                    ? <span style={{ fontWeight: 700, color: primeUnit > 0 ? c.color : COLORS.textMuted, fontSize: 13 }}>{primeUnit > 0 ? `${primeUnit.toLocaleString()} $` : "—"}</span>
                                    : <span style={{ color: COLORS.textMuted }}>—</span>}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )
              })()}
            </>)}
          </div>
        )}

        {/* CLASSEMENT */}
        {page === "classement" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ color: COLORS.gold, margin: 0 }}>Classement</h2>
              <select value={semaine?.id || ""} onChange={e => setSemaine(semaines.find(x => x.id === parseInt(e.target.value)))}
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

            {/* BLOC CHAMPIONS */}
            <div style={{ marginTop: 24 }}>
              {(() => {
                const sem = scores.filter(s => s.semaine_id === semaine?.id)
                if (sem.length === 0) return null

                const best = (key) => sem.reduce((a, b) => (b[key] ?? 0) > (a[key] ?? 0) ? b : a, sem[0])
                const bestActions = sem.reduce((a, b) => {
                  const ta = (a.cambu||0)+(a.atm||0)+(a.apu||0)+(a.go_fast||0)+(a.fleeca||0)+(a.armu||0)
                  const tb = (b.cambu||0)+(b.atm||0)+(b.apu||0)+(b.go_fast||0)+(b.fleeca||0)+(b.armu||0)
                  return tb > ta ? b : a
                }, sem[0])
                const totalActionsB = (bestActions.cambu||0)+(bestActions.atm||0)+(bestActions.apu||0)+(bestActions.go_fast||0)+(bestActions.fleeca||0)+(bestActions.armu||0)

                // Meilleur salaire depuis la vue salaires
                const bestSalaire = salaires.filter(s => s.semaine_id === semaine?.id).reduce((a, b) => (b.salaire_total ?? 0) > (a.salaire_total ?? 0) ? b : a, salaires[0] || {})

                const champVente = best("vente")
                const champPlant = best("plantation")
                const champPrison = best("prison")

                const trophies = [
                  { icon: "💊", title: "Champion des Ventes", name: champVente?.member_name, value: `${champVente?.vente ?? 0} ventes`, color: "#f472b6" },
                  { icon: "🌿", title: "Roi du Jardin", name: champPlant?.member_name, value: `${champPlant?.plantation ?? 0} plantations`, color: "#4ade80" },
                  { icon: "⚡", title: "Top Action", name: bestActions?.member_name, value: `${totalActionsB} actions`, color: COLORS.gold },
                  { icon: "⛓️", title: "Légende du Placard", name: champPrison?.member_name, value: `${champPrison?.prison ?? 0} prisons`, color: COLORS.danger },
                  { icon: "💰", title: "Le plus Payé", name: bestSalaire?.member_name, value: `${Math.round(bestSalaire?.salaire_total ?? 0).toLocaleString()} $`, color: COLORS.success },
                ]

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
                    {trophies.map(t => (
                      <div key={t.title} style={{ background: COLORS.card, border: `1px solid ${t.color}44`, borderRadius: 14, padding: "1.25rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: t.color }} />
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t.title}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: t.color, marginBottom: 4 }}>
                          {MEMBER_PHOTOS[t.name]
                            ? <img src={MEMBER_PHOTOS[t.name]} alt={t.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", objectPosition: "center top", border: `2px solid ${t.color}`, display: "block", margin: "0 auto 6px" }} />
                            : <div style={{ width: 48, height: 48, borderRadius: "50%", background: COLORS.blue, border: `2px solid ${t.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 6px" }}>👤</div>
                          }
                          {t.name || "—"}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{t.value}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
        {page === "salaires" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ color: COLORS.gold }}>Salaires</h2>
              <select value={semaine?.id || ""} onChange={e => setSemaine(semaines.find(x => x.id === parseInt(e.target.value)))}
                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.card, color: COLORS.text }}>
                {semaines.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
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
        )}

        {/* HIERARCHIE */}
        {page === "hierarchie" && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: COLORS.gold, marginBottom: "2rem" }}>Hiérarchie</h2>
            {(() => {
              const gradeOrder = ["Chef","Capo","Sous Capo","Commandant","Lieutenant","Soldat d'élite","Soldat","Charbon"]
              const gradeIcons = { "Chef":"👑","Capo":"👑","Sous Capo":"🥈","Commandant":"⭐","Lieutenant":"🎖️","Soldat d'élite":"🗡️","Soldat":"⚔️","Charbon":"🪨" }
              const gradeColors = {
                "Chef": { border: COLORS.gold }, "Capo": { border: COLORS.gold },
                "Sous Capo": { border: COLORS.blueLight }, "Commandant": { border: "#6b7fa3" },
                "Lieutenant": { border: "#555" }, "Soldat d'élite": { border: "#444" }, "Soldat": { border: COLORS.border }, "Charbon": { border: "#3a3a3a" }
              }
              const grouped = gradeOrder.reduce((acc, g) => {
                const list = members.filter(m => (m.grade || "Soldat") === g)
                if (list.length > 0) acc.push({ grade: g, members: list })
                return acc
              }, [])
              return grouped.map(({ grade, members: gm }, gi) => {
                const c = gradeColors[grade] || gradeColors["Soldat"]
                const icon = gradeIcons[grade] || "⚔️"
                const isTop = ["Chef","Capo"].includes(grade)
                return (
                  <div key={grade}>
                    {gi > 0 && <div style={{ width: 2, height: 30, background: COLORS.border, margin: "0 auto" }} />}
                    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 4 }}>
                      {gm.map(m => (
                        <div key={m.id} style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `2px solid ${c.border}`, width: isTop ? 180 : 140 }}>
                          {MEMBER_PHOTOS[m.name]
                            ? <img src={MEMBER_PHOTOS[m.name]} alt={m.name} style={{ width: "100%", height: isTop ? 240 : 180, objectFit: "cover", objectPosition: "center top", display: "block" }} />
                            : <div style={{ width: "100%", height: isTop ? 240 : 180, background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isTop ? 56 : 40 }}>{icon}</div>
                          }
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "30px 10px 10px", textAlign: "center" }}>
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
            {(() => {
              const gradeOrder = ["Chef","Capo","Sous Capo","Commandant","Lieutenant","Soldat d'élite","Soldat","Charbon"]
              const gradeColors = {
                "Chef": COLORS.gold, "Capo": COLORS.gold, "Sous Capo": COLORS.blueLight,
                "Commandant": "#6b7fa3", "Lieutenant": "#8899bb", "Soldat d'élite": "#aab0c0",
                "Soldat": COLORS.textMuted, "Charbon": "#555"
              }
              const gradeIcons = {
                "Chef":"👑","Capo":"👑","Sous Capo":"🥈","Commandant":"⭐",
                "Lieutenant":"🎖️","Soldat d'élite":"🗡️","Soldat":"⚔️","Charbon":"🪨"
              }
              return gradeOrder.map(grade => {
                const list = members.filter(m => (m.grade || "Charbon") === grade)
                if (list.length === 0) return null
                return (
                  <div key={grade} style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span>{gradeIcons[grade]}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: gradeColors[grade], textTransform: "uppercase", letterSpacing: "0.1em" }}>{grade}</span>
                      <div style={{ flex: 1, height: 1, background: `${gradeColors[grade]}44`, marginLeft: 8 }} />
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>{list.length} membre{list.length > 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      {list.map(m => (
                        <div key={m.id} style={{ background: COLORS.card, border: `1px solid ${gradeColors[grade]}44`, borderRadius: 14, overflow: "hidden", width: 160, flexShrink: 0 }}>
                          {MEMBER_PHOTOS[m.name]
                            ? <img src={MEMBER_PHOTOS[m.name]} alt={m.name} style={{ width: "100%", height: 180, objectFit: "cover", objectPosition: "center top", display: "block" }} />
                            : <div style={{ width: "100%", height: 180, background: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>{gradeIcons[grade]}</div>
                          }
                          <div style={{ padding: "10px 12px", borderTop: `1px solid ${gradeColors[grade]}44` }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.text }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: gradeColors[grade], marginTop: 3, fontWeight: 600 }}>{grade}</div>
                            <div style={{ fontSize: 11, color: m.active ? COLORS.success : COLORS.danger, marginTop: 4 }}>{m.active ? "✅ Actif" : "❌ Inactif"}</div>
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

        {/* SAISIE */}
        {page === "saisie" && (
          <div>
            <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Saisir une activité</h2>
            {card(<>
              {isAdmin && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Membre</label>
                  {sel(form.member_id, v => setForm({...form, member_id: v}),
                    [<option key="" value="">-- Choisir --</option>, ...members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)]
                  )}
                </div>
              )}
              {!isAdmin && <p style={{ color: COLORS.textMuted, marginBottom: 14, fontSize: 14 }}>Saisie pour <strong style={{ color: COLORS.gold }}>{member?.name}</strong></p>}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Semaine</label>
                {sel(form.semaine_id, v => setForm({...form, semaine_id: v}), semaines.map(s => <option key={s.id} value={s.id}>{s.nom}</option>))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Type d'activité</label>
                {sel(form.type, v => setForm({...form, type: v, drogue: "", quantity: ["Apu","Cambu","Go fast","Atm","Armu","Fleeca"].includes(v) ? 1 : form.quantity}), TYPES.map(t => <option key={t} value={t}>{t}</option>))}
              </div>
              {form.type === "vente" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Drogue</label>
                  {sel(form.drogue, v => setForm({...form, drogue: v}),
                    [<option key="" value="">-- Choisir --</option>, ...DROGUES_LIST.map(d => <option key={d} value={d}>{d}</option>)]
                  )}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Quantité</label>
                {["Apu","Cambu","Go fast","Atm","Armu","Fleeca"].includes(form.type)
                  ? <div style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.textMuted, boxSizing: "border-box", fontSize: 14 }}>1 <span style={{ fontSize: 12, color: COLORS.textMuted }}>(action unique)</span></div>
                  : inp(form.quantity, v => setForm({...form, quantity: v}), "number")
                }
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
            {[
              { key: "Caméra 29", label: "29" },
              { key: "Coffre 24", label: "24" },
              { key: "Coffre 60", label: "60" },
              { key: "Coffre 118", label: "118" },
              { key: "Coffre 129", label: "129" },
              { key: "Villa 1", label: "Villa 1" },
              { key: "Villa 2", label: "Villa 2" },
            ].map(({ key, label }) => (
              card(<>
                <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>📦 Coffre {label}</h3>
                {stockCamera.filter(s => s.coffre === key && s.quantite > 0).length === 0
                  ? <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Aucun item en stock.</p>
                  : <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {stockCamera.filter(s => s.coffre === key && s.quantite > 0).map(s => (
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
              </>, { marginBottom: 16 })
            ))}
          </div>
        )}

        {/* ADMIN */}
        {page === "admin" && isAdmin && (
          <div>
            <h2 style={{ color: COLORS.gold, marginBottom: "1.5rem" }}>Administration</h2>

            {/* AJOUTER MEMBRE */}
            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>Ajouter un membre</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Nom</label>
                  {inp(newMember, setNewMember, "text", "Nom du membre")}
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>Email</label>
                  {inp(newMemberEmail, setNewMemberEmail, "email", "email@frenchriviera.com")}
                </div>
                {goldBtn("Ajouter", handleAddMember)}
              </div>
              {message && <p style={{ color: message.includes("✅") ? COLORS.success : COLORS.danger, marginTop: 10, fontSize: 13 }}>{message}</p>}
            </>, { marginBottom: 16 })}

            {/* GÉRER MEMBRES */}
            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 14, fontSize: 14, textTransform: "uppercase" }}>Gérer les membres</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.blue }}>
                    {["Membre","Email","UID","Grade","MDP","Action"].map(h => (
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
                          {["Charbon","Soldat","Soldat d'élite","Lieutenant","Commandant","Sous Capo","Capo","Chef"].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <button onClick={async () => {
                          if (!m.user_id) return alert("Pas de compte auth.")
                          const p = prompt(`Nouveau MDP pour ${m.name} :`)
                          if (!p || p.length < 6) return alert("❌ Min 6 caractères.")
                          const res = await fetch(EDGE_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                            body: JSON.stringify({ user_id: m.user_id, password: p })
                          })
                          if (res.ok) alert(`✅ MDP de ${m.name} mis à jour !`)
                          else alert("❌ Erreur.")
                        }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: COLORS.blueLight, color: "#fff", cursor: "pointer", fontSize: 12 }}>🔑</button>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <button onClick={() => handleDeleteMember(m.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: COLORS.danger, color: "#fff", cursor: "pointer", fontSize: 12 }}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>, { marginBottom: 16 })}

            {/* QUOTAS */}
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
              {goldBtn("Sauvegarder", async () => {
                await supabase.from("quotas").update({ actions: quotas.actions, plantations: quotas.plantations, ventes: quotas.ventes }).eq("id", 1)
                setMessage("✅ Quotas mis à jour !")
                setTimeout(() => setMessage(""), 3000)
              })}
              {message && <p style={{ color: COLORS.success, marginTop: 10, fontSize: 13 }}>{message}</p>}
            </>, { marginBottom: 16 })}

            {/* PRIX DES DROGUES */}
            {card(<>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ color: COLORS.gold, margin: 0, fontSize: 14, textTransform: "uppercase" }}>💊 Prix des drogues</h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Nom de la drogue..."
                    id="new-drogue-input"
                    style={{ padding: "7px 12px", borderRadius: 7, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, fontSize: 13, width: 200 }}
                  />
                  {goldBtn("+ Ajouter", async () => {
                    const input = document.getElementById("new-drogue-input")
                    const nom = input.value.trim().toUpperCase()
                    if (!nom) return alert("❌ Saisis un nom de drogue.")
                    if (drugPrices.find(d => d.drogue === nom)) return alert("❌ Cette drogue existe déjà.")
                    const { error } = await supabase.from("drug_prices").insert([{ drogue: nom, prix_achat: 0, prix_vente: 0 }])
                    if (error) return alert("❌ Erreur : " + error.message)
                    input.value = ""
                    loadData()
                  }, { padding: "7px 14px", fontSize: 13 })}
                </div>
              </div>
              {drugPrices.length === 0
                ? <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Aucune drogue trouvée. Exécute le SQL d'initialisation dans Supabase.</p>
                : <>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: COLORS.blue }}>
                        {["Drogue", "Prix d'achat ($)", "Prix de vente ($)", "Marge", ""].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: h === "Drogue" ? "left" : "center", color: COLORS.gold, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drugPrices.map((dp, i) => {
                        const marge = (dp.prix_vente ?? 0) - (dp.prix_achat ?? 0)
                        return (
                          <tr key={dp.drogue} style={{ background: i % 2 === 0 ? COLORS.card : COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: COLORS.gold }}>{dp.drogue}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                value={dp.prix_achat ?? 0}
                                onChange={e => setDrugPrices(drugPrices.map(d =>
                                  d.drogue === dp.drogue ? { ...d, prix_achat: parseFloat(e.target.value) || 0 } : d
                                ))}
                                style={{ width: 120, padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, textAlign: "center", fontSize: 13 }}
                              />
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                value={dp.prix_vente ?? 0}
                                onChange={e => setDrugPrices(drugPrices.map(d =>
                                  d.drogue === dp.drogue ? { ...d, prix_vente: parseFloat(e.target.value) || 0 } : d
                                ))}
                                style={{ width: 120, padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, textAlign: "center", fontSize: 13 }}
                              />
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: marge > 0 ? COLORS.success : marge < 0 ? COLORS.danger : COLORS.textMuted }}>
                              {marge > 0 ? "+" : ""}{marge.toLocaleString()} $
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              <button onClick={async () => {
                                if (!confirm(`Supprimer ${dp.drogue} ?`)) return
                                await supabase.from("drug_prices").delete().eq("drogue", dp.drogue)
                                loadData()
                              }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: COLORS.danger, color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14 }}>
                    {goldBtn(drugPricesSaving ? "Sauvegarde..." : "💾 Sauvegarder les prix", async () => {
                      setDrugPricesSaving(true)
                      for (const dp of drugPrices) {
                        await supabase.from("drug_prices").upsert(
                          { drogue: dp.drogue, prix_achat: dp.prix_achat ?? 0, prix_vente: dp.prix_vente ?? 0, updated_at: new Date().toISOString() },
                          { onConflict: "drogue" }
                        )
                      }
                      setDrugPricesSaving(false)
                      setMessage("✅ Prix mis à jour !")
                      setTimeout(() => setMessage(""), 3000)
                    }, { opacity: drugPricesSaving ? 0.6 : 1 })}
                    {message && <span style={{ color: message.includes("✅") ? COLORS.success : COLORS.danger, fontSize: 13 }}>{message}</span>}
                  </div>
                </>
              }
            </>, { marginBottom: 16 })}

            {/* PLANTATION CONFIG */}
            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 20, fontSize: 14, textTransform: "uppercase" }}>🌿 Configuration plantation</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { key: "prix_graine", label: "Prix graine ($)" },
                  { key: "prix_pot", label: "Prix pot ($)" },
                  { key: "nb_branches", label: "Nb branches / plantation" },
                  { key: "prix_branche_vente", label: "Prix vente branche ($)" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", marginBottom: 6, color: COLORS.textMuted, fontSize: 13 }}>{label}</label>
                    <input type="number" min="0" value={plantConfig[key] ?? 0}
                      onChange={e => setPlantConfig({ ...plantConfig, [key]: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, boxSizing: "border-box", fontSize: 14 }} />
                  </div>
                ))}
              </div>
              {(() => {
                const coutAchat = (plantConfig.prix_graine ?? 0) + (plantConfig.prix_pot ?? 0)
                const recette = (plantConfig.nb_branches ?? 0) * (plantConfig.prix_branche_vente ?? 0)
                const margeBrut = recette - coutAchat
                const margeNet = margeBrut * 0.70
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "Coût d'achat", value: coutAchat, color: COLORS.danger, prefix: "" },
                      { label: "Recette brute", value: recette, color: COLORS.text, prefix: "" },
                      { label: "Marge brute", value: margeBrut, color: margeBrut >= 0 ? COLORS.success : COLORS.danger, prefix: margeBrut >= 0 ? "+" : "" },
                      { label: "Marge nette (30% taxe)", value: margeNet, color: margeNet >= 0 ? COLORS.gold : COLORS.danger, prefix: margeNet >= 0 ? "+" : "" },
                    ].map(({ label, value, color, prefix }) => (
                      <div key={label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color }}>{prefix}{Math.round(value).toLocaleString()} $</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {goldBtn(plantSaving ? "Sauvegarde..." : "💾 Sauvegarder", async () => {
                  setPlantSaving(true)
                  await supabase.from("plantation_config").update({
                    prix_graine: plantConfig.prix_graine,
                    prix_pot: plantConfig.prix_pot,
                    nb_branches: plantConfig.nb_branches,
                    prix_branche_vente: plantConfig.prix_branche_vente,
                    updated_at: new Date().toISOString()
                  }).eq("id", 1)
                  setPlantSaving(false)
                  setMessage("✅ Configuration plantation sauvegardée !")
                  setTimeout(() => setMessage(""), 3000)
                }, { opacity: plantSaving ? 0.6 : 1 })}
                {message && <span style={{ color: message.includes("✅") ? COLORS.success : COLORS.danger, fontSize: 13 }}>{message}</span>}
              </div>
            </>, { marginBottom: 16 })}

            {/* PRIMES CONFIG */}
            {card(<>
              <h3 style={{ color: COLORS.gold, marginBottom: 20, fontSize: 14, textTransform: "uppercase" }}>🏆 Pourcentages de prime</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                {[
                  { key: "charbon", label: "Charbon (%)", desc: "Grade le plus bas" },
                  { key: "soldat", label: "Soldat / Soldat élite (%)", desc: "Grades intermédiaires" },
                  { key: "haut_grade", label: "Haut gradé (%)", desc: "Lieutenant → Chef" },
                  { key: "meilleur", label: "Meilleur de la semaine (%)", desc: "Planteur & vendeur #1" },
                ].map(({ key, label, desc }) => (
                  <div key={key}>
                    <label style={{ display: "block", marginBottom: 4, color: COLORS.textMuted, fontSize: 13 }}>{label}</label>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{desc}</div>
                    <input type="number" min="0" max="100" value={primeConfig[key] ?? 0}
                      onChange={e => setPrimeConfig({ ...primeConfig, [key]: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#0a1628", color: COLORS.text, boxSizing: "border-box", fontSize: 14 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {goldBtn(primeSaving ? "Sauvegarde..." : "💾 Sauvegarder", async () => {
                  setPrimeSaving(true)
                  await supabase.from("prime_config").update({
                    charbon: primeConfig.charbon, soldat: primeConfig.soldat,
                    haut_grade: primeConfig.haut_grade, meilleur: primeConfig.meilleur,
                    updated_at: new Date().toISOString()
                  }).eq("id", 1)
                  setPrimeSaving(false)
                  setMessage("✅ Primes mises à jour !")
                  setTimeout(() => setMessage(""), 3000)
                }, { opacity: primeSaving ? 0.6 : 1 })}
                {message && <span style={{ color: message.includes("✅") ? COLORS.success : COLORS.danger, fontSize: 13 }}>{message}</span>}
              </div>
            </>, { marginBottom: 16 })}

            {/* CRÉER SEMAINE */}
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
