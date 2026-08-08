import PageShell from '../components/PageShell.jsx'

function GetStarted() {
  return (
    <PageShell
      title="Get Started"
      subtitle="Begin your journey"
      description="Start building your Honey Vision ecosystem with expert guidance, product selection, and fast delivery."
    >
      <div className="section-grid">
        <div className="info-card">
          <h2>Talk to an expert</h2>
          <p>Our team helps you choose the right product mix for security and IT infrastructure.</p>
        </div>
        <div className="info-card">
          <h2>Install with ease</h2>
          <p>Get installation scheduling, AMC setup, and remote support all in one place.</p>
        </div>
      </div>
    </PageShell>
  )
}

export default GetStarted
