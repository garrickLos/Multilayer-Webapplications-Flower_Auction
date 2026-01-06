/*
to do:
- ervoor zorgen dat deze gebruikt kan worden voor eventuele errors
    - Geen items gevonden, Niet ingelogd, etc..
*/

export function ErrorScherm (LaadTekst?: string){
    return (
        <main className="Laadscherm-main">
            <section className="LaadSectie">
                <p>Geen items kunnen vinden</p>
            </section>
        </main>
    );
}