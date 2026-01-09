import { GenereerKnop } from '../../../Componenten/Knop';

// voor wanneer de veiling niet gevonden kan worden of als de gebruiker niet is ingelogd.
export function GeenVeilingBezig() {
    return (
        <>
            <br></br>
            <span>
                Het is mogelijk dat de veiling is afgelopen, niet meer bestaat of dat u niet bent ingelogd.
            </span>
            <br></br>

            <GenereerKnop
                classNames={['Button', 'VerlopenSessie']} 
                bericht={'naar hoofdmenu'} 
                to={`/home`} 
            />

            <GenereerKnop
                classNames={['Button', 'VerlopenSessie']} 
                bericht={'inloggen'} 
                to={`/inloggen`} 
            />
        </>
    )
}