import PageShell from '../components/PageShell.jsx'

function RequestDemo() {
  return (
    <PageShell
      title="Request a Demo"
      subtitle="See Honey Vision in action"
      description="Schedule a demo to watch our cameras, AI tools, and installation workflow in a live session."
    >
      <div className="section-grid">
        <div className="info-card">
          <h2>Demo booking</h2>
          <p>Fill out your details and choose a time slot for a personalized demo.</p>
        </div>
        <div className="info-card">
          <h2>Expert walkthrough</h2>
          <p>See real product features, configuration steps, and installation planning live.</p>
        </div>
      </div>
    </PageShell>
  )
}

export default RequestDemo
