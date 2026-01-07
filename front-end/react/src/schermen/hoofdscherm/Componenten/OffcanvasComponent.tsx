import React from 'react';
import { InfoVeld } from '../../../Componenten/InformatieVelden';

import './style.css';

export const ContainerSideMenu = ({ isOpen }: { isOpen: boolean }) => {
    return (
        // Hier voegen we de class 'open' toe als isOpen true is
        <div className={`sideBarMenu ${isOpen ? 'open' : 'closed'}`}>
            <div className="Auction_Informatievelden_Container aanbieder_informatie sideBarMenu">
                <div className="kopje">Aanbieder informatie</div>
                <InfoVeld Titel={'Bloemsoort:'} Bericht={"huidigProduct?.naam"}
                    BerichtClass={'rightSideText'}/>
                        
                <InfoVeld Titel={'Aanvoerder: '} Bericht={"**kweker naam hier**"}
                    BerichtClass={'rightSideText'}/>

                <br></br>
                        
                <InfoVeld Titel={'Historische prijzen van deze aanbieder (laatste 10)'} />

                <InfoVeld Titel={'Aanbieder: '} Bericht={"**kweker naam hier**"}
                    BerichtClass={'rightSideText'}/>

                <div className='HuidigeAanbieder'>
                    <InfoVeld Titel={'Datum:'} Bericht={"Prijs:"}
                        BerichtClass={'rightSideText'}/>

                    <InfoVeld Titel={'**Datum**'} Bericht={"1 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"2 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"3 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"4 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"5 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"6 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"7 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"8 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"9 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Datum**'} Bericht={"10 euro"}
                        BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'Gemiddelde prijs alle historische order van de **insert kweker**:'} Bericht={"**insert gemiddelde**"}
                        BerichtClass={'rightSideText'}/>
                </div>
                <br></br>

                    <InfoVeld Titel={'Historische prijzen van alle aanbieder (laatste 10)'} />

                    <InfoVeld Titel={'Aanbieder: '} Bericht={"**kweker naam hier**"}
                        BerichtClass={'rightSideText'}/>
                <div className='alleAanbieders'>
                    <InfoVeld Titel={'Aanbieder:'} tussenkop={'Datum:'} Bericht={"Prijs:"}
                        BerichtClass={'rightSideText'}/>

                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"1 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"2 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"2 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"4 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"5 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"6 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"7 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"8 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"9 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                    <InfoVeld Titel={'**Aanbieder**'} tussenkop={'**Datum**'} Bericht={"10 euro"}
                        tussenkopClass={'tussenkop'} BerichtClass={'rightSideText'}/>
                </div>
            </div>
        </div>
    );
};

// export const ParentComponent = () => {
    

//     return (
//         <>
//         <div className='SidebarParent'>
//                 <div style={{ padding: '20px' }}>
//                     <h3>Hoofd Content</h3>
                    
//                 </div>

//                 <ContainerSideMenu isOpen={isOpen} />
//             </div>
//         </>
//     );
// }