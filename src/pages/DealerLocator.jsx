import PageShell from '../components/PageShell.jsx'

function DealerLocator() {
  return (
    <PageShell
      title="Dealer Locator"
      subtitle="Find a dealer"
      description="Locate trusted dealers near you for product delivery, installation, and AMC support."
    >
      <div className="info-card">
        <h2>Dealer network</h2>
        <p>Search by city or pin code to connect with certified Honey Vision dealers.</p>
      </div>
    </PageShell>
  )
}

export default DealerLocator
