import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  buildDemoSession,
  demoResetPassword,
  demoSignIn,
  demoSignInAsRole,
  demoSignOut,
  demoSignUp,
  getDemoSessionUserId,
  loadDemoDb,
} from '../lib/demoStore'
import { AuthContext } from './auth'
import { getConsentRecords } from '../services/consentService'

async function loadConsents(id) {
  const rows = await getConsentRecords(id)
  return {
    userId: id,
    values: Object.fromEntries(rows.map(row => [row.consent_type, row.granted])),
    dates: Object.fromEntries(rows.map(row => [row.consent_type, row.updated_at])),
    error: '',
  }
}

function loadDemoProfileState(userId) {
  if (!userId) return { session: null, profile: null, role: 'individual', loading: false, profileError: '' }
  const db = loadDemoDb()
  const user = db.users.find(u => u.id === userId)
  if (!user) return { session: null, profile: null, role: 'individual', loading: false, profileError: '' }
  return {
    session: buildDemoSession(user),
    profile: {
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      physical_context: user.physical_context || null,
      equity: user.equity || {},
    },
    role: user.role || 'individual',
    loading: false,
    profileError: '',
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() =>
    supabase
      ? { session: null, profile: null, role: 'individual', loading: true, profileError: '' }
      : loadDemoProfileState(getDemoSessionUserId())
  )
  const [consentState, setConsentState] = useState({ userId: null, values: {}, dates: {}, error: '' })
  const userId = auth.session?.user.id

  useEffect(() => {
    let active = true
    const request = userId ? loadConsents(userId) : Promise.resolve({ userId: null, values: {}, dates: {}, error: '' })
    request.then(state => { if (active) setConsentState(state) }).catch(error => {
      if (active) setConsentState({ userId, values: {}, dates: {}, error: error.message || 'Unable to load your consent preferences.' })
    })
    return () => { active = false }
  }, [userId])

  const refreshConsents = useCallback(async () => {
    if (userId) setConsentState(await loadConsents(userId))
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    if (!supabase) {
      setAuth(loadDemoProfileState(userId))
      return
    }
    const { data, error } = await supabase.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle()
    if (!error && data) {
      setAuth(prev => ({ ...prev, profile: data, role: data.role || 'individual' }))
    }
  }, [userId])

  useEffect(() => {
    if (!supabase) return
    let active = true
    let revision = 0
    async function updateSession(session) {
      const current = ++revision
      setAuth({ session, profile: null, role: 'individual', loading: Boolean(session), profileError: '' })
      if (!session) return
      try {
        const { data, error } = await supabase.from('profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle()
        if (error) throw error
        if (active && current === revision) setAuth({ session, profile: data, role: data?.role || 'individual', loading: false, profileError: '' })
      } catch {
        if (active && current === revision) setAuth({ session, profile: null, role: 'individual', loading: false, profileError: 'Your profile could not be loaded. Please try signing in again.' })
      }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { if (active) void updateSession(session) }, 0)
    })
    const initialRevision = revision
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && revision === initialRevision) {
        if (error) setAuth(previous => ({ ...previous, loading: false, profileError: error.message }))
        else void updateSession(data.session)
      }
    }).catch(() => {
      if (active && revision === initialRevision) setAuth(previous => ({ ...previous, loading: false, profileError: 'Unable to restore your session. Please sign in again.' }))
    })
    return () => { active = false; revision++; subscription.unsubscribe() }
  }, [])

  async function handleSignUp(email, password, fullName) {
    if (!supabase) {
      const result = demoSignUp(email, password, fullName)
      if (!result.error && result.data.user) setAuth(loadDemoProfileState(result.data.user.id))
      return result
    }
    return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
  }

  async function handleSignIn(email, password) {
    if (!supabase) {
      const result = demoSignIn(email, password)
      if (!result.error && result.data.user) setAuth(loadDemoProfileState(result.data.user.id))
      return result
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function handleDemoRoleSignIn(role) {
    const result = demoSignInAsRole(role)
    if (!result.error && result.data.user) setAuth(loadDemoProfileState(result.data.user.id))
    return result
  }

  async function handleResetPassword(email, newPassword) {
    if (!supabase) {
      return demoResetPassword(email, newPassword)
    }
    return supabase.auth.resetPasswordForEmail(email)
  }

  async function handleSignOut() {
    if (!supabase) {
      const result = demoSignOut()
      setAuth({ session: null, profile: null, role: 'individual', loading: false, profileError: '' })
      setConsentState({ userId: null, values: {}, dates: {}, error: '' })
      return result
    }
    return supabase.auth.signOut()
  }

  const value = {
    ...auth,
    user: auth.session?.user ?? null,
    configured: true,
    demoMode: !supabase,
    consents: consentState.userId === userId ? consentState.values : {},
    consentDates: consentState.userId === userId ? consentState.dates : {},
    consentError: consentState.userId === userId ? consentState.error : '',
    consentsLoading: Boolean(userId && consentState.userId !== userId),
    refreshConsents,
    refreshProfile,
    signUp: handleSignUp,
    signIn: handleSignIn,
    demoSignIn: handleDemoRoleSignIn,
    resetPassword: handleResetPassword,
    signOut: handleSignOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
