import PageShell from '../components/PageShell.jsx'

function Solutions() {
  return (
    <PageShell
      title="Solutions"
      subtitle="Tailored security systems"
      description="Find solutions for retail, hospitality, manufacturing, residential, and enterprise installations."
    >
      <div className="section-grid">
        <div className="info-card">
          <h2>Retail security</h2>
          <p>Protect your store with intelligent surveillance, loss prevention, and remote monitoring.</p>
        </div>
        <div className="info-card">
          <h2>Smart enterprises</h2>
          <p>Secure operations with access control, visitor management, and analytics dashboards.</p>
        </div>
        <div className="info-card">
          <h2>Installer support</h2>
          <p>Get tools for installation scheduling, product configuration, and post-sale service.</p>
        </div>
      </div>
    </PageShell>
  )
}

export default Solutions
