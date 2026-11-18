import { supabase } from '../lib/supabase'
import { STATUS, isActiveReferral } from './referralService'
import { appendDemoAudit, demoGenerateId, loadDemoDb, saveDemoDb } from '../lib/demoStore'

export const OUTCOME_OPTIONS = [
  { id: 'improved', label: 'Symptom / functioning improved' },
  { id: 'stable', label: 'Stable / continuing plan' },
  { id: 'coordinated_care', label: 'Coordinated with primary / medical care' },
  { id: 'stepped_up', label: 'Stepped up to higher-intensity care' },
  { id: 'worsened', label: 'Symptoms worsened — review required' },
]

export function filterReferrals(referrals, filter) {
  return referrals.filter(referral => {
    if (filter === 'all') return true
    if (filter === 'urgent') return (referral.crisis_flagged || referral.priority === 'urgent' || referral.status === 'escalated') && isActiveReferral(referral)
    if (filter === 'active') return isActiveReferral(referral)
    return STATUS[referral.status]?.terminal === true
  })
}

export function allowedStatuses(referral, professionalId) {
  return referral.user_id === professionalId ? [] : Object.keys(STATUS).filter(status => !['cancelled', 'pending', 'accepted', 'unable_to_contact'].includes(status))
}

function hydrateClinicianRows(db, referrals) {
  return referrals
    .sort((a, b) => {
      const urgentA = a.crisis_flagged || a.priority === 'urgent' || a.status === 'escalated' ? 1 : 0
      const urgentB = b.crisis_flagged || b.priority === 'urgent' || b.status === 'escalated' ? 1 : 0
      if (urgentB !== urgentA) return urgentB - urgentA
      return Date.parse(b.created_at) - Date.parse(a.created_at)
    })
    .map(referral => {
      const owner = db.users.find(u => u.id === referral.user_id)
      const service = db.support_services.find(s => s.id === referral.service_id)
      const profile = referral.share_contact && owner ? { full_name: owner.full_name } : null
      const physical_context = referral.share_physical_context && owner ? owner.physical_context : null
      const userAssessments = referral.share_results
        ? db.assessments
          .filter(a => a.user_id === referral.user_id)
          .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        : []
      const assessments = ['PHQ9', 'GAD7', 'PSS10', 'WHO5']
        .map(instrument => userAssessments.find(row => row.instrument === instrument))
        .filter(Boolean)
      const follow_ups = db.follow_ups
        .filter(f => f.referral_id === referral.id)
        .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
      const adverse_events = (db.adverse_events || [])
        .filter(ev => ev.referral_id === referral.id)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      return {
        ...referral,
        service: service ? { name: service.name, tier: service.tier } : null,
        profile,
        physical_context,
        assessments,
        follow_ups,
        adverse_events,
      }
    })
}

export async function listAssignedReferrals(professionalId) {
  if (!supabase) {
    const db = loadDemoDb()
    return hydrateClinicianRows(db, db.referrals.filter(r => r.professional_id === professionalId))
  }

  const { data, error } = await supabase
    .from('referrals')
    .select('*, service:support_services(name, tier), follow_ups(*)')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return Promise.all(data.map(async referral => {
    let profile = null
    let assessments = []
    if (referral.share_contact) {
      const result = await supabase.from('profiles').select('full_name').eq('id', referral.user_id).maybeSingle()
      if (result.error) throw result.error
      profile = result.data
    }
    if (referral.share_results) {
      const result = await supabase.from('assessments').select('instrument, total_score, severity, created_at').eq('user_id', referral.user_id).order('created_at', { ascending: false })
      if (result.error) throw result.error
      assessments = ['PHQ9', 'GAD7'].map(instrument => result.data.find(row => row.instrument === instrument)).filter(Boolean)
    }
    return {
      ...referral,
      profile,
      physical_context: null,
      assessments,
      adverse_events: [],
      follow_ups: [...referral.follow_ups].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)),
    }
  }))
}

export async function listCoordinatorReferrals() {
  if (!supabase) {
    const db = loadDemoDb()
    return hydrateClinicianRows(db, [...db.referrals])
  }
  return []
}

export async function listPrimaryCareCases() {
  if (!supabase) {
    const db = loadDemoDb()
    return hydrateClinicianRows(db, db.referrals.filter(r => r.share_physical_context))
  }
  return []
}

export async function updateReferralStatus(id, status, actorId = null) {
  if (!Object.hasOwn(STATUS, status) || status === 'cancelled') throw new Error('Choose a permitted professional status.')
  if (!supabase) {
    const db = loadDemoDb()
    const referral = db.referrals.find(r => r.id === id)
    if (!referral) throw new Error('Referral not found.')
    const now = new Date().toISOString()
    referral.status = status
    if (!referral.first_response_at && !['support_requested', 'submitted'].includes(status)) referral.first_response_at = now
    if (status === 'appointment_attended') referral.attendance_status = 'attended'
    referral.updated_at = now
    appendDemoAudit(db, actorId || referral.professional_id, 'UPDATE_STATUS', 'referrals', referral.id)
    saveDemoDb(db)
    return referral
  }
  const { data, error } = await supabase.from('referrals').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function scheduleAppointment(referralId, { appointmentAt, appointmentMode, attendanceStatus, actorId }) {
  if (!supabase) {
    const db = loadDemoDb()
    const referral = db.referrals.find(r => r.id === referralId)
    if (!referral) throw new Error('Referral not found.')
    const now = new Date().toISOString()
    if (appointmentAt) referral.appointment_at = new Date(appointmentAt).toISOString()
    if (appointmentMode) referral.appointment_mode = appointmentMode
    if (attendanceStatus) referral.attendance_status = attendanceStatus
    if (attendanceStatus === 'attended') referral.status = 'appointment_attended'
    else if (appointmentAt && ['submitted', 'received', 'professional_review', 'pending', 'accepted'].includes(referral.status)) {
      referral.status = 'appointment_scheduled'
    }
    if (!referral.first_response_at) referral.first_response_at = now
    referral.updated_at = now
    appendDemoAudit(db, actorId || referral.professional_id, 'APPOINTMENT_UPDATED', 'referrals', referralId)
    saveDemoDb(db)
    return referral
  }
  throw new Error('Appointment scheduling requires the extended schema.')
}

export async function acknowledgeCrisis(referralId, professionalId) {
  if (!supabase) {
    const db = loadDemoDb()
    const referral = db.referrals.find(r => r.id === referralId)
    if (!referral) throw new Error('Referral not found.')
    const now = new Date().toISOString()
    referral.crisis_acknowledged_at = now
    if (!referral.first_response_at) referral.first_response_at = now
    referral.updated_at = now
    appendDemoAudit(db, professionalId, 'CRISIS_HANDOVER_ACKNOWLEDGED', 'referrals', referralId)
    saveDemoDb(db)
    return referral
  }
  return referralId
}

export async function completeCrisisResponse(referralId, professionalId, note) {
  if (!supabase) {
    const db = loadDemoDb()
    const referral = db.referrals.find(r => r.id === referralId)
    if (!referral) throw new Error('Referral not found.')
    const now = new Date().toISOString()
    if (!referral.crisis_acknowledged_at) referral.crisis_acknowledged_at = now
    referral.crisis_completed_at = now
    if (!referral.first_response_at) referral.first_response_at = now
    if (['submitted', 'received', 'pending', 'escalated'].includes(referral.status)) referral.status = 'professional_review'
    referral.updated_at = now
    db.follow_ups.push({
      id: demoGenerateId('fu'),
      referral_id: referralId,
      author_id: professionalId,
      note: note?.trim() || 'Human clinician acknowledged urgent escalation and completed safety outreach.',
      outcome: 'Crisis safety protocol completed by licensed professional',
      outcome_status: 'stepped_up',
      created_at: now,
    })
    appendDemoAudit(db, professionalId, 'CRISIS_RESPONSE_COMPLETED', 'referrals', referralId)
    saveDemoDb(db)
    return referral
  }
  return updateReferralStatus(referralId, 'accepted')
}

export async function addFollowUp(referralId, note, outcome, outcomeStatus = '', authorId = null) {
  if (!note.trim() && !outcome.trim()) throw new Error('Enter a note or outcome.')
  if (!supabase) {
    const db = loadDemoDb()
    const now = new Date().toISOString()
    const referral = db.referrals.find(r => r.id === referralId)
    if (referral) {
      if (!referral.first_response_at) referral.first_response_at = now
      referral.updated_at = now
    }
    const item = {
      id: demoGenerateId('fu'),
      referral_id: referralId,
      author_id: authorId || referral?.professional_id || null,
      note: note.trim() || null,
      outcome: outcome.trim() || null,
      outcome_status: outcomeStatus || null,
      created_at: now,
    }
    db.follow_ups.push(item)
    appendDemoAudit(db, item.author_id, 'INSERT', 'follow_ups', item.id)
    saveDemoDb(db)
    return item
  }
  const { data, error } = await supabase.from('follow_ups').insert({ referral_id: referralId, note: note.trim() || null, outcome: outcome.trim() || null }).select().single()
  if (error) throw error
  return data
}

export async function reportAdverseEvent({ referralId, reportedBy, category, severity, summary, actionTaken }) {
  if (!category?.trim() || !summary?.trim()) throw new Error('Provide an event category and summary.')
  if (!supabase) {
    const db = loadDemoDb()
    const record = {
      id: demoGenerateId('ae'),
      referral_id: referralId || null,
      reported_by: reportedBy,
      category: category.trim(),
      severity: severity || 'moderate',
      summary: summary.trim(),
      action_taken: actionTaken?.trim() || 'Logged for platform safety review',
      status: 'open',
      created_at: new Date().toISOString(),
    }
    if (!Array.isArray(db.adverse_events)) db.adverse_events = []
    db.adverse_events.unshift(record)
    appendDemoAudit(db, reportedBy, 'ADVERSE_EVENT_REPORTED', 'adverse_events', record.id)
    saveDemoDb(db)
    return record
  }
  throw new Error('Adverse event reporting requires the extended schema when connected to Supabase.')
}
