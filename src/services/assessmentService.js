import { supabase } from '../lib/supabase'
import { scoreAssessment } from '../data/instruments'
import { appendDemoAudit, demoGenerateId, loadDemoDb, saveDemoDb } from '../lib/demoStore'

export async function saveAssessment(userId, instrumentId, answers, extras = {}) {
  const { total, severity } = scoreAssessment(instrumentId, answers)
  const functioning = Number.isInteger(extras.functioning) ? extras.functioning : null
  const optInSignals = Array.isArray(extras.optInSignals) ? extras.optInSignals : []

  if (!supabase) {
    const db = loadDemoDb()
    const record = {
      id: demoGenerateId('assess'),
      user_id: userId,
      instrument: instrumentId,
      total_score: total,
      severity,
      answers: [...answers],
      functioning,
      opt_in_signals: optInSignals,
      created_at: new Date().toISOString(),
    }
    db.assessments.unshift(record)
    appendDemoAudit(db, userId, 'INSERT', 'assessments', record.id)
    saveDemoDb(db)
    return record
  }

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      user_id: userId,
      instrument: instrumentId,
      total_score: total,
      severity,
      answers,
      functioning,
      opt_in_signals: optInSignals,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listAssessments(userId) {
  if (!supabase) {
    const db = loadDemoDb()
    return db.assessments
      .filter(row => row.user_id === userId)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  }
  const { data, error } = await supabase
    .from('assessments')
    .select('id, instrument, total_score, severity, functioning, opt_in_signals, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAssessment(userId, id) {
  if (!supabase) {
    const db = loadDemoDb()
    return db.assessments.find(row => row.user_id === userId && row.id === id) || null
  }
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}
