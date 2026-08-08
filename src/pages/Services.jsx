import PageShell from '../components/PageShell.jsx'

function Services() {
  return (
    <PageShell
      title="Services"
      subtitle="End-to-end service delivery"
      description="From installation booking to AMC support, our service network keeps your business protected."
    >
      <div className="section-grid">
        <div className="info-card">
          <h2>Installation booking</h2>
          <p>Schedule certified installers and track your installation progress online.</p>
        </div>
        <div className="info-card">
          <h2>AMC plans</h2>
          <p>Choose annual maintenance contracts to keep equipment running smoothly.</p>
        </div>
        <div className="info-card">
          <h2>Dealer assistance</h2>
          <p>Connect with trusted dealers for long-term support and inventory replenishment.</p>
        </div>
      </div>
    </PageShell>
  )
}

export default Services
