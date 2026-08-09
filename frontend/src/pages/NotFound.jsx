import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main className="page notfound-page">
      <section className="page-hero">
        <p className="eyebrow">Page not found</p>
        <h1>404</h1>
        <p>The page you are looking for does not exist or was moved.</p>
        <Link to="/" className="button primary">
          Return home
        </Link>
      </section>
    </main>
  )
}

export default NotFound
