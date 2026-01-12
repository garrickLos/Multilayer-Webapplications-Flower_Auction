/*
to do:
- ervoor zorgen dat deze gebruikt kan worden voor eventuele errors
    - Geen items gevonden, Niet ingelogd, etc..
*/

export function ErrorScherm (){
    return (
        <main className="Laadscherm-main">
            <section className="LaadSectie">
                <p>Geen items kunnen vinden</p>
            </section>
        </main>
    );
}
