import React, { useState } from 'react'; // 1. Importeer useState
import '../../css/privacybeleidStylesheet.css';

export default function PrivacyScherm() { 
    const [openItemId, setOpenItemId] = useState<string | null>(null);

    const handleHeaderClick = (itemId: string) => {
        setOpenItemId(itemId === openItemId ? null : itemId);
    };

    const getItemClass = (itemId: string) => {
        return openItemId === itemId ? 'gegevens open' : 'gegevens closed';
    };

    return (
        <main className="privacyBeleid_main">
            <div className="background-left">
                <h2>Privacy beleid</h2>

                <div className="dropdown">
                    <section className={getItemClass('algemeen')}>
                        <div className="item-header" onClick={() => handleHeaderClick('algemeen')}>
                            <h5>1. algemene gegevens</h5>
                        </div>
                        {openItemId === 'algemeen' && ( 
                            <div className="item-content" id="algemeneGegevens">
                                <p>Dit zijn de algemene gegevens die wij verwerken...</p>
                            </div>
                        )}
                    </section>

                    {/* Item 2: Persoonlijke Gegevens */}
                    <section className={getItemClass('persoonlijk')}>
                        <div className="item-header" onClick={() => handleHeaderClick('persoonlijk')}>
                            <h5>2. persoonlijke gegevens</h5>
                        </div>
                        {openItemId === 'persoonlijk' && (
                            <div className="item-content" id="persoonlijkeGegevens">
                                <p>Dit zijn de persoonlijke gegevens die wij verwerken...</p>
                            </div>
                        )}
                    </section>
                    
                    {/* Item 3: Cookies */}
                    <section className={getItemClass('cookies')}>
                        <div className="item-header" onClick={() => handleHeaderClick('cookies')}>
                            <h5>3. cookies en derde partijen</h5>
                        </div>
                        {openItemId === 'cookies' && (
                            <div className="item-content" id="cookies">
                                <p>Dit is ons beleid met betrekking tot cookies en derde partijen...</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}