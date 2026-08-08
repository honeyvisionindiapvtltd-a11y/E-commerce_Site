import PageShell from '../components/PageShell.jsx'

function Delivery() {
  return (
    <PageShell
      title="Delivery Information"
      subtitle="Shipping & installation"
      description="Learn about our shipping policy, delivery timelines, and installation arrangements for all regions."
    >
      <div className="section-grid">
        <div className="info-card">
          <h2>Fast delivery</h2>
          <p>We deliver across India with trackable shipping and optional white-glove handling.</p>
        </div>
        <div className="info-card">
          <h2>Installation service</h2>
          <p>Book installation at checkout or schedule your technician for a convenient time slot.</p>
        </div>
      </div>
    </PageShell>
  )
}

export default Delivery
