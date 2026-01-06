import { useLocation } from 'react-router-dom';
import { GenereerKnop } from '../../Componenten/Knop';

import '../../css/404Stylesheet.css';

export default function ErrorPage({ AanvullendeInfo }: any) {
  const location = useLocation();
  
  // 1. Lees het label uit
  const foutType = location.state?.foutType;

  // 2. Maak een variabele voor de content
  let teTonenInfo = AanvullendeInfo;

  // 3. Als het label 'sessieVerlopen' is, maak dan hier de HTML aan
  if (foutType === 'sessieVerlopen') {
      teTonenInfo = sessieVerlopenError();
  }

  return (
    <main className="Error_page" role="main" aria-labelledby="error-title">
      <section className="Error_Section" aria-describedby="error-desc">
        <h1 id="error-title">Error 404</h1>
        <p id="error-desc">Pagina niet gevonden</p>

        {teTonenInfo}
          
      </section>
    </main>
  )
}

function sessieVerlopenError() {
  return (
    <>
    <br></br>
      <span>
        Probeer de pagina te refreshen of opnieuw in te loggen
      </span>
      <br></br>
      <GenereerKnop
        classNames={'Button'} 
        bericht={'inloggen'} 
        to={`/inloggen`} 
      />
    </>
  );
}