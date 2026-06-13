import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export default function App() {
  const [scores, setScores] = useState([])
  const [editions, setEditions] = useState([])
  const [editionId, setEditionId] = useState(null)

  useEffect(() => {
    supabase.from("editions").select("*").then(({ data }) => {
      setEditions(data)
      if (data.length > 0) setEditionId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!editionId) return
    supabase
      .from("scores")
      .select("*")
      .eq("edition_id", editionId)
      .then(({ data }) => setScores(data))
  }, [editionId])

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>🏆 Classement French Riviera</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", justifyContent: "center" }}>
        {editions.map(e => (
          <button
            key={e.id}
            onClick={() => setEditionId(e.id)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: editionId === e.id ? "#222" : "#fff",
              color: editionId === e.id ? "#fff" : "#222",
              cursor: "pointer"
            }}
          >
            {e.name}
          </button>
        ))}
      </div>

      {scores.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999" }}>Aucune activité pour cette édition.</p>
      ) : (
        scores.map((s, i) => (
          <div key={s.member_id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", marginBottom: 8,
            borderRadius: 10, border: "1px solid #eee",
            background: i === 0 ? "#fffbea" : "#fff"
          }}>
            <span style={{ fontSize: 24 }}>{medals[i] || `#${i + 1}`}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{s.member_name}</span>
            <span style={{ fontWeight: 700, fontSize: 18 }}>{s.points} pts</span>
          </div>
        ))
      )}
    </div>
  )
}