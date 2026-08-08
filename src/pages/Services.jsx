import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
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
          <Link
            to="/book-installation"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-white"
          >
            Book Installation
            <ArrowRight size={16} />
          </Link>
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
