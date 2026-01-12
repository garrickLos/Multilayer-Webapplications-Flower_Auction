import { useLocation } from 'react-router-dom';

import { GeenVeilingBezig, sessieVerlopenError } from './404Settings';

import '../../css/404Stylesheet.css';

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

function GetExtraInfo(foutType: any){
  switch(foutType){

    case 'sessieVerlopen':
      return sessieVerlopenError();
    
    case 'GeenVeilingBezig':
      return GeenVeilingBezig();
  }
}