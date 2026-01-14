import { laadIcon } from "../../../Componenten/Laadicon"

//css:
import '../../../css/Componenten/laadscherm.css';

/**
 * 
 * @param LaadTekst Tekst die wordt gebruikt om bij het laadIcon wat wordt geladen op het moment
 * @returns een kleine section die tekst toont bij een laadIcon
 */
export function Laadscherm (LaadTekst?: string){
    return (
        <main className="Laadscherm-main">
            <section className="LaadSectie">
                {laadIcon(LaadTekst)}
            </section>
        </main>
    );
}