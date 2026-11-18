import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import Button from './Button'

const ROLE_DESTINATIONS = {
  individual: '/dashboard',
  professional: '/professional',
  primary_care: '/primary-care',
  coordinator: '/coordinator',
  admin: '/admin',
  analyst: '/analytics',
}

export default function AuthForm({ register = false }) {
  const { session, role, loading, demoMode, signIn, signUp, demoSignIn, resetPassword } = useAuth()
  const { lang } = useI18n()
  const isAr = lang === 'ar'
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const navigate = useNavigate()

  if (!loading && session) {
    return <Navigate to={ROLE_DESTINATIONS[role] || '/dashboard'} replace />
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const email = form.get('email').trim()
    const password = form.get('password')
    const name = form.get('fullName')?.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.')
    }
    if (!password || (register && password.length < 8)) {
      return setError(register ? 'Use a password with at least 8 characters.' : 'Please enter your password.')
    }
    if (register && !name) return setError('Please enter your full name.')
    if (register && password !== form.get('confirmPassword')) return setError('The passwords do not match.')
    setBusy(true)
    try {
      const { data, error: authError } = register ? await signUp(email, password, name) : await signIn(email, password)
      if (authError) throw authError
      if (data.session) {
        const nextRole = data.role || data.user?.user_metadata?.role || role
        navigate(register ? '/consent' : ROLE_DESTINATIONS[nextRole] || '/dashboard', { replace: true })
      } else {
        setMessage('Check your email to confirm your account before logging in.')
      }
    } catch (err) {
      setError(err.message || 'We could not connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function submitReset(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const email = form.get('resetEmail').trim()
    const newPassword = form.get('newPassword')
    if (!email || !newPassword || newPassword.length < 8) {
      return setError('Enter your email and a new password of at least 8 characters.')
    }
    setBusy(true)
    try {
      const { error: resetErr } = await resetPassword(email, newPassword)
      if (resetErr) throw resetErr
      setShowReset(false)
      setMessage('Password updated. You can now log in with your new password.')
    } catch (err) {
      setError(err.message || 'Unable to reset password.')
    } finally {
      setBusy(false)
    }
  }

  async function quickLogin(targetRole) {
    setError('')
    setBusy(true)
    try {
      const { error: authError } = await demoSignIn(targetRole)
      if (authError) throw authError
      navigate(ROLE_DESTINATIONS[targetRole] || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to switch to demo account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-card card">
      <p className="eyebrow">{isAr ? 'خطوة آمنة لرفاهك' : 'A SMALL STEP FOR YOURSELF'}</p>
      <h1>{register ? (isAr ? 'إنشاء حساب جديد' : 'Create your MindBridge AI account') : isAr ? 'مرحباً بعودتك' : 'Welcome back'}</h1>
      <p>
        {register
          ? isAr
            ? 'ابدأ رحلتك بسرية تامة — أنت تتحكم فيما تشاركه.'
            : 'Begin your MindBridge AI journey. You control every consent choice.'
          : isAr
            ? 'سجّل الدخول إلى مساحتك الخاصة.'
            : 'Log in to your wellbeing or clinical role workspace.'}
      </p>

      {demoMode && (
        <div className="notice" role="status">
          <strong>{isAr ? 'دخول فوري للأدوار الستة (بدون كلمة مرور)' : 'One-click role login (no password needed · synthetic demo data)'}</strong>
          <div className="actions demo-actions">
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('individual')}>
              Individual (Amira)
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('professional')}>
              Mental Health Clinician
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('primary_care')}>
              Primary Care Physician
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('coordinator')}>
              Care Coordinator
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('admin')}>
              System Admin
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('analyst')}>
              Population Analyst
            </Button>
          </div>
          {!register && (
            <p className="muted">
              Demo email login password: <code>password123</code> (e.g., <code>amira@mindbridge.demo</code>, <code>dr.tariq@mindbridge.demo</code>, <code>dr.nadia@mindbridge.demo</code>, <code>coordinator@mindbridge.demo</code>, <code>admin@mindbridge.demo</code>, <code>analyst@mindbridge.demo</code>). Or <Link to="/register">register</Link> any email in this browser.
            </p>
          )}
        </div>
      )}

      {!showReset ? (
        <form onSubmit={submit} noValidate>
          {register && (
            <label>
              {isAr ? 'الاسم الكامل' : 'Full name'}
              <input name="fullName" autoComplete="name" required maxLength={120} />
            </label>
          )}
          <label>
            {isAr ? 'البريد الإلكتروني' : 'Email address'}
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            {isAr ? 'كلمة المرور' : 'Password'}
            <input
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={register ? 8 : undefined}
              aria-describedby={register ? 'password-help' : undefined}
            />
          </label>
          {register && (
            <>
              <small id="password-help">Use at least 8 characters.</small>
              <label>
                {isAr ? 'تأكيد كلمة المرور' : 'Confirm password'}
                <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
              </label>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          <Button type="submit" disabled={busy || loading}>
            {busy ? 'Please wait…' : register ? (isAr ? 'إنشاء حساب' : 'Create account') : isAr ? 'دخول' : 'Log in'}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitReset} noValidate>
          <label>
            Account email
            <input name="resetEmail" type="email" required />
          </label>
          <label>
            New password (min 8 chars)
            <input name="newPassword" type="password" minLength={8} required />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <Button type="submit" disabled={busy}>
              Reset password
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => setShowReset(false)}>
              Back to login
            </Button>
          </div>
        </form>
      )}

      {!register && !showReset && (
        <p>
          <button type="button" className="tier-link" onClick={() => setShowReset(true)}>
            {isAr ? 'إعادة تعيين كلمة المرور' : 'Forgot or reset password'}
          </button>
        </p>
      )}

      <p className="muted">
        {register ? (isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?') : isAr ? 'جديد في مايند بريدج AI؟' : 'New to MindBridge AI?'}{' '}
        <Link to={register ? '/login' : '/register'}>{register ? (isAr ? 'تسجيل الدخول' : 'Log in') : isAr ? 'إنشاء حساب' : 'Create an account'}</Link>
      </p>
      <Link to="/privacy">{isAr ? 'اقرأ نهج الخصوصية' : 'Read our privacy approach'}</Link>
    </section>
  )
}
