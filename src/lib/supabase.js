import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

function isBrowserForbiddenSecretKey(value) {
  if (!value) return false
  if (value.startsWith('sb_secret_')) return true
  const parts = value.split('.')
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload?.role === 'service_role') return true
    } catch {
      // ignore malformed JWT
    }
  }
  return false
}

export const supabaseKeyError = isBrowserForbiddenSecretKey(key)
  ? 'A Supabase secret/service_role key was placed in VITE_SUPABASE_ANON_KEY. Secret keys are forbidden in the browser — replace VITE_SUPABASE_ANON_KEY with your Supabase Publishable / anon public key (sb_publishable_... or anon JWT) and rotate the exposed secret key in Supabase.'
  : ''

export const supabase = url && key && !supabaseKeyError ? createClient(url, key) : null
