import { GenereerKnop } from '../../../Componenten/Knop';

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