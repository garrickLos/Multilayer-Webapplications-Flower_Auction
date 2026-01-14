import { useLocation } from 'react-router-dom';

import { GeenVeilingBezig, sessieVerlopenError } from './404Settings';

import '../../css/404Stylesheet.css';

/**
 * 
 * @returns een div met de tekst van een 404 met snelle en vage info over de 404
 * Extra info kan getoond worden indien er een fouttype is meegegeven in de state
 */
export default function ErrorPage() {
  const location = useLocation();
  
  // Leest het label uit
  const foutType = location.state?.foutType;

  // variable om info te tonen bij de 404 pagina
  let teTonenInfo = GetExtraInfo(foutType);

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

/**
 * 
 * @param foutType Types die een specifieke error tonen bij de 404 pagina. Moet specifiek soorten zijn om het werkend te maken.
 * @returns 
 */
function GetExtraInfo(foutType: "sessieVerlopen" | "GeenVeilingBezig"){
  switch(foutType){

    case 'sessieVerlopen':
      return sessieVerlopenError();
    
    case 'GeenVeilingBezig':
      return GeenVeilingBezig();
  }
}