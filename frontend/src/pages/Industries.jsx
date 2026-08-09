import PageShell from '../components/PageShell.jsx'

function Industries() {
  return (
    <PageShell
      title="Industries"
      subtitle="Industry-specific security"
      description="Protect retail, manufacturing, healthcare, hospitality, and residential spaces with purpose-built systems."
    >
      <div className="section-grid">
        <div className="info-card">
          <h2>Retail & hospitality</h2>
          <p>Secure customer areas, inventory, and service entrances with advanced monitoring.</p>
        </div>
        <div className="info-card">
          <h2>Manufacturing</h2>
          <p>Control access and monitor facilities with AI-enabled safety and analytics.</p>
        </div>
        <div className="info-card">
          <h2>Residential</h2>
          <p>Protect homes and gated communities with cameras, alarms, and remote support.</p>
        </div>
      </div>
    </PageShell>
  )
}

export default Industries
