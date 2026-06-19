import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { user_id, password, email, create } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Création d'un nouvel utilisateur
  if (create && email && password) {
    if (password.length < 6) {
      return new Response('Password too short', { status: 400 })
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { status: 200 })
  }

  // Changement de mot de passe
  if (!user_id || !password) {
    return new Response('Missing user_id or password', { status: 400 })
  }
  if (password.length < 6) {
    return new Response('Password too short', { status: 400 })
  }
  const { error } = await supabase.auth.admin.updateUserById(user_id, { password })
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})