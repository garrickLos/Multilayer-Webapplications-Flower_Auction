import '../../src/css/Componenten/laadIcon.css';

/**
 * 
 * @param laadTekst Tekst die gerenderd wordt onder de laadIcon
 * @returns een div die een draaiende cirkel laat zien met tekst eronder wat er geladen wordt
 */
export function laadIcon(laadTekst?: string) {
    return (
        <div className='loadIcon-container'>
            <div className="loader"></div>
            {laadTekstRenderen(laadTekst)}
        </div>
    );
}

/**
 * 
 * @param laadTekst tekst die gerenderd moet worden
 * @returns een h1 element die onder de renderIcon zit.
 */
// als er geen tekst wordt meegegeven dan renderd die niks
//handig voor knoppen
function laadTekstRenderen(laadTekst?: string) {
    if (laadTekst != null) {
        return <h1>{laadTekst}</h1>
    }
}