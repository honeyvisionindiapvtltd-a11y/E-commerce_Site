import { Link } from 'react-router-dom'

function Home() {
  return (
    <main className="page home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">AI-Powered Security & Technology</span>
          <h1>Honey Vision India</h1>
          <p>
            Build a smarter, safer business with AI recommendations, secure products,
            fast installation, AMC coverage, and dealer support.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="button primary">
              Browse Products
            </Link>
            <Link to="/contact" className="button secondary">
              Talk to Sales
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-stat">
            <strong>300+</strong>
            <span>Security products</span>
          </div>
          <div className="hero-stat">
            <strong>24/7</strong>
            <span>Customer support</span>
          </div>
          <div className="hero-stat">
            <strong>1000+</strong>
            <span>Installations completed</span>
          </div>
        </div>
      </section>

      <section className="section highlights">
        <div className="feature-card">
          <h2>Smart commerce</h2>
          <p>Search products, compare options, and checkout with secure payment gateways.</p>
        </div>
        <div className="feature-card">
          <h2>Installation services</h2>
          <p>Schedule professional installation and track your booking in one place.</p>
        </div>
        <div className="feature-card">
          <h2>AMC & support</h2>
          <p>Manage annual maintenance contracts, service requests, and dealer communication.</p>
        </div>
      </section>
    </main>
  )
}

export default Home
