import '../../src/css/Componenten/laadIcon.css';

export function laadIcon(laadTekst?: string) {
    return (
        <div className='loadIcon-container'>
            <div className="loader"></div>
            {laadTekstRenderen(laadTekst)}
        </div>
    );
}

// als er geen tekst wordt meegegeven dan renderd die niks
//handig voor knoppen
function laadTekstRenderen(laadTekst?: string) {
    if (laadTekst != null) {
        return <h1>{laadTekst}</h1>
    }
}