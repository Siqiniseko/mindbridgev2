import { Link } from 'react-router-dom'
import { Activity, Compass, HeartHandshake, Lock, PhoneCall, ShieldAlert, Stethoscope } from 'lucide-react'
import { useI18n } from '../context/i18n'
import { crisisDetails } from '../data/safety'

const PILLARS_EN = [
  [Compass, '1. Recognise early', 'Validated PHQ-9, GAD-7, PSS-10 & WHO-5 self-assessments in Arabic & English help track changes over time.', 'Early detection'],
  [Activity, '2. Understand clearly', 'Transparent score explanations show what a result means and does not mean — never presented as a diagnosis.', 'No automated diagnosis'],
  [HeartHandshake, '3. Navigate stepped care', 'Discover Abu Dhabi options across self-help, community, primary care, tele-mental health, specialist, and urgent care.', 'Stepped navigation'],
  [Stethoscope, '4. Connect & coordinate', 'Book referrals and tele-health slots, and optionally share physical-care context (Malaffi-ready demo concept).', 'Coordinated care'],
  [ShieldAlert, '5. Human-led escalation', 'Immediate emergency guidance (998 & Sakina 800-725462) and priority clinician review bypass routine queues.', 'Human-in-the-loop'],
  [Lock, '6. Measure outcomes fairly', 'De-identified monitoring of conversion, wait times, attendance, symptom improvement, and demographic fairness.', 'Outcome monitoring'],
]

const PILLARS_AR = [
  [Compass, '١. التعرّف المبكر', 'أدوات فحص معتمدة (PHQ-9 وGAD-7 وPSS-10 وWHO-5) بالعربية والإنجليزية لمتابعة التغيرات عبر الزمن.', 'كشف مبكر'],
  [Activity, '٢. الفهم الواضح', 'شرح شفاف لمعنى النتيجة وما لا تعنيه — ولا تُقدّم أبداً كتشخيص طبي.', 'بدون تشخيص آلي'],
  [HeartHandshake, '٣. التوجيه المتدرج', 'اكتشف خدمات أبوظبي عبر المساعدة الذاتية، الدعم المجتمعي، الرعاية الأولية، الطب النفسي عن بُعد، والرعاية التخصصية.', 'رعاية متدرجة'],
  [Stethoscope, '٤. التواصل والتنسيق', 'إرسال إحالات وحجز مواعيد ومشاركة السياق الصحي الجسدي بموافقتك (مفهوم جاهز للتكامل مع ملفي).', 'رعاية منسّقة'],
  [ShieldAlert, '٥. تصعيد بقيادة المختصين', 'إرشاد طوارئ فوري (998 وخط سكينة 800-725462) وتحويل عاجل للمختصين يتجاوز قوائم الانتظار الاعتيادية.', 'إشراف بشري'],
  [Lock, '٦. قياس النتائج والعدالة', 'متابعة غير مُعرّفة الهوية لمعدلات التحويل، أوقات الانتظار، الحضور، تحسن الأعراض، والعدالة عبر الفئات.', 'مراقبة النتائج'],
]

const FAQS = [
  {
    qEn: 'Does MindBridge AI diagnose mental health conditions or replace doctors?',
    aEn: 'No. MindBridge AI provides validated screening and navigation only. Licensed healthcare professionals make all clinical assessments and care decisions.',
    qAr: 'هل تقوم منصة مايند بريدج AI بتشخيص الحالات النفسية أو استبدال الأطباء؟',
    aAr: 'لا. توفر المنصة فحصاً أولياً وتوجيهاً للرعاية فقط، بينما يتخذ المختصون المرخصون جميع القرارات السريرية.',
  },
  {
    qEn: 'Can my employer or insurer see my wellbeing scores?',
    aEn: 'Never. Identifiable screening answers, scores, and personal notes are protected by granular consent and strict role-based controls, and are never shared with employers.',
    qAr: 'هل يمكن لجهة عملي أو شركة التأمين الاطلاع على نتائجي؟',
    aAr: 'مطلقاً. جميع الإجابات والنتائج والملاحظات محمية بموافقة تفصيلية وضوابط وصول صارمة ولا تُكشف أبداً لجهات العمل.',
  },
  {
    qEn: 'Are the TAMM, Malaffi, and provider listings live integrations right now?',
    aEn: 'For this hackathon prototype, provider directories and Malaffi clinical summaries use clearly labelled simulated/demonstration records. Real emergency numbers (UAE 998, Sakina 800-725462, Estijaba 800 1717) are provided for safety guidance.',
    qAr: 'هل التكامل مع ملفي وتم ومزودي الخدمة فعلياً في هذا النموذج؟',
    aAr: 'لأغراض النموذج الأولي للهاكاثون، تعتمد سجلات ملفي وبعض المزودين على بيانات محاكاة واضحة التسمية، مع توفير أرقام الطوارئ الحقيقية في الإمارات (998 وسكينة 800-725462).',
  },
]

export default function Landing() {
  const { lang, t } = useI18n()
  const isAr = lang === 'ar'
  const pillars = isAr ? PILLARS_AR : PILLARS_EN

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1>{t.hero.title}</h1>
          <p className="hero-copy">{t.hero.subtitle}</p>
          <div className="journey-strip" aria-label={t.hero.journeyLabel}>
            {t.hero.journeySteps.map((step, i) => (
              <span key={step} className="journey-pill">
                {step}
                {i < t.hero.journeySteps.length - 1 ? ' →' : ''}
              </span>
            ))}
          </div>
          <div className="actions">
            <Link className="button" to="/register">
              {t.hero.ctaPrimary} <span aria-hidden="true">{isAr ? '←' : '→'}</span>
            </Link>
            <Link className="button button-secondary" to="/login">
              {t.hero.ctaDemo}
            </Link>
            <Link className="button button-secondary" to="/privacy">
              {t.hero.ctaPrivacy}
            </Link>
          </div>
          <p className="muted">{t.hero.disclaimer}</p>
        </div>

        <aside className="hero-note">
          <HeartHandshake size={48} strokeWidth={1.5} aria-hidden="true" />
          <h2>{t.brand}</h2>
          <p>
            <strong>{t.tagline}</strong>
          </p>
          <div className="note-rule" />
          <p>
            {isAr
              ? 'مصممة لبيئة الرعاية الصحية في أبوظبي: ثنائية اللغة (العربية والإنجليزية)، رعاية متدرجة، وتصعيد آمن بقيادة المختصين.'
              : 'Built for Abu Dhabi: bilingual Arabic & English, stepped care navigation, physical-mental coordination, and human-led safety.'}
          </p>
        </aside>
      </section>

      <section aria-labelledby="how-it-works">
        <p className="eyebrow">{t.landing.howEyebrow}</p>
        <h2 id="how-it-works">{t.landing.howTitle}</h2>
        <div className="card-grid">
          {pillars.map(([Icon, title, copy, tag]) => (
            <article className="card" key={title}>
              <Icon className="card-icon" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
              <span className="badge">{tag}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="card dashboard-section" aria-labelledby="privacy-safety-heading">
        <h2 id="privacy-safety-heading">{t.landing.privacyTitle}</h2>
        <p>{t.landing.privacyBody}</p>
        <Link to="/privacy">{t.hero.ctaPrivacy}</Link>
      </section>

      <section className="safety-panel dashboard-section" aria-labelledby="emergency-heading">
        <h2 id="emergency-heading">
          <PhoneCall size={22} aria-hidden="true" /> {t.landing.emergencyTitle}
        </h2>
        <ul className="crisis-list">
          {crisisDetails.emergencyNumbers.map(item => (
            <li key={item.label}>
              <strong>
                {isAr ? item.labelAr : item.label}: {item.number}
              </strong>{' '}
              — {isAr ? item.noteAr : item.note}
            </li>
          ))}
        </ul>
        <p className="muted">{isAr ? crisisDetails.disclaimerAr : crisisDetails.disclaimer}</p>
      </section>

      <section className="card dashboard-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading">{t.landing.faqTitle}</h2>
        <div className="faq-list">
          {FAQS.map(item => (
            <details key={item.qEn} className="faq-item">
              <summary>{isAr ? item.qAr : item.qEn}</summary>
              <p>{isAr ? item.aAr : item.aEn}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
