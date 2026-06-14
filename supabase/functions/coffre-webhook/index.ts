import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
 if (req.method === 'GET') {
    return new Response('OK', { status: 200 })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.json()
  const message = body.message as string
  const coffre = body.coffre as string

  if (!message || !coffre) {
    return new Response('Missing message or coffre', { status: 400 })
  }

  // Parser le message : "Prénom Nom a déposé 3911x Argent Sale"
  const match = message.match(/^(.+?) a (déposé|retiré) (\d+)x (.+)$/)
  if (!match) {
    return new Response('Message format invalide', { status: 400 })
  }

  const membre = match[1]
  const action = match[2] === 'déposé' ? 'depose' : 'retire'
  const quantite = parseInt(match[3])
  const item = match[4]

  // Trouver ou créer le coffre
  let { data: coffreData } = await supabase
    .from('coffres')
    .select('id')
    .eq('nom', coffre)
    .single()

  if (!coffreData) {
    const { data: newCoffre } = await supabase
      .from('coffres')
      .insert([{ nom: coffre }])
      .select()
      .single()
    coffreData = newCoffre
  }

  // Insérer l'événement
  const { error } = await supabase.from('coffre_events').insert([{
    coffre_id: coffreData.id,
    membre,
    action,
    quantite,
    item
  }])

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})