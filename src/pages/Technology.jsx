import PageShell from '../components/PageShell.jsx'

function Technology() {
  return (
    <PageShell
      title="Technology"
      subtitle="AI-driven security stack"
      description="Discover AI camera recommendations, analytics, storage planning, and comparison tools."
    >
      <div className="section-grid">
        <div className="info-card">
          <h2>AI recommendations</h2>
          <p>Get product suggestions and coverage planning tailored to your space.</p>
        </div>
        <div className="info-card">
          <h2>Cloud integration</h2>
          <p>Use Cloudinary, secure payments, and location services for a seamless experience.</p>
        </div>
        <div className="info-card">
          <h2>Performance analytics</h2>
          <p>Monitor device health, order flow, and installation metrics from one dashboard.</p>
        </div>
      </div>
    </PageShell>
  )
}

export default Technology
