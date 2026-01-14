import { GenereerKnop } from '../../../Componenten/Knop';

/**
 * 
 * @returns Extra informatie die getoond wordt op de 404 pagina wanneer de "VerlopenSessie" wordt meegegeven aan de state
 */
export function sessieVerlopenError() {
  return (
    <>
        <br></br>
        <span>
            Probeer de pagina te refreshen of opnieuw in te loggen
        </span>
        <br></br>

        <GenereerKnop
            classNames={['Button', 'VerlopenSessie']} 
            bericht={'Terug'} 
            to={`/home`} 
        />

        <GenereerKnop
            classNames={['Button', 'VerlopenSessie']} 
            bericht={'inloggen'} 
            to={`/inloggen`} 
        />
    </>
  );
}