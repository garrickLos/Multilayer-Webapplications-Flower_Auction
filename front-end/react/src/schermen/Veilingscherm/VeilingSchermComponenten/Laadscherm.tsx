import { laadIcon } from "../../../Componenten/Laadicon"

//css:
import '../../../css/Componenten/laadscherm.css';

export function Laadscherm (LaadTekst?: string){
    return (
        <main className="Laadscherm-main">
            <section className="LaadSectie">
                {laadIcon(LaadTekst)}
            </section>
        </main>
    );
}