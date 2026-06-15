import Link from 'next/link'

const features = [
  'Správa klientů, projektů a webů',
  'Poptávky uložené jako auditovatelný lead',
  'Workflow task vytvořený přímo z poptávky',
  'Obsahové stránky, formuláře a globální nastavení webu'
]

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-panel">
        <p className="home-kicker">Autopilot ClientOps CMS</p>
        <h1>Jedno rozhraní pro weby, poptávky a navazující práci.</h1>
        <p className="home-copy">
          První verze propojuje Payload CMS, lead intake a jednoduchou workflow frontu. Veřejné weby
          posílají poptávky do API, admin z nich vidí leady a systém k nim zakládá úkoly.
        </p>
        <div className="home-actions">
          <Link href="/admin">Otevřít admin</Link>
          <Link href="/api/workflow/tasks">Workflow JSON</Link>
        </div>
      </section>
      <section className="feature-list" aria-label="MVP capabilities">
        {features.map((feature) => (
          <article key={feature}>
            <span />
            <p>{feature}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
