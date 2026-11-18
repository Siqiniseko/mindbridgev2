import { useI18n } from '../context/i18n'

export default function CrisisBanner() {
  const { t } = useI18n()
  return (
    <aside className="crisis-banner" aria-label="Urgent support">
      {t.crisis.bannerPrefix} <strong>{t.crisis.sakina}</strong> · <strong>{t.crisis.ambulance}</strong>
      <span> · {t.crisis.bannerNote}</span>
    </aside>
  )
}
