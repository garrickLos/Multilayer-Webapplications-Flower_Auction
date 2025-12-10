// ErrorPage.tsx
import '../../css/404Stylesheet.css'

export default function ErrorPage() {
  return (
    <main className="Error" role="main" aria-labelledby="error-title">
      <section className="Error_Section" aria-describedby="error-desc">
        
        <h1 id="error-title">Error 404</h1>
        <p id="error-desc">Pagina niet gevonden</p>
      </section>
    </main>
  )
}