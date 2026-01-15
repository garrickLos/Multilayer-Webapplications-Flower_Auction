import { useState } from 'react';

import { useFetchDatajson } from '../../Componenten/index';
import { renderContent } from './../privacyBeleid/Componenten/index';

// import index types
import type { ContentBlock } from './../privacyBeleid/Componenten/index';

import '../../css/privacybeleidStylesheet.css';

const url = new URL("../../resources/Json/privacyBeleid.json", import.meta.url).toString();

export default function PrivacyScherm() {
    //houdt bij welke items momenteel opengeklapt zijn null betekent alle items dicht
    const [openItemId, setOpenItemId] = useState<string | null>(null);

    // Fetching data met het juiste type
    const algemeneDataState = useFetchDatajson<ContentBlock>("algemene gegevens", url);
    const persoonlijkeDataState = useFetchDatajson<ContentBlock>("persoonlijke gegevens", url);
    const cookiesDataState = useFetchDatajson<ContentBlock>("cookies", url);

    //klapt de bijbehorende blok info open
    const handleHeaderClick = (itemId: string) => {
        setOpenItemId(itemId === openItemId ? null : itemId);
    };

    //status van de blok info (open of dicht)
    const getItemClass = (itemId: string) => {
        return openItemId === itemId ? 'gegevens open' : 'gegevens closed';
    };

    return (
        <main className="privacyBeleid_main">
            <div className="background-left">
                <h1>Privacy beleid</h1>

                <div className="dropdown">
                    {/* Item 1: Algemeen */}
                    <section className={getItemClass('algemeen')}>
                        <div className="item-header" onClick={() => handleHeaderClick('algemeen')}>
                            <h5>1. algemene gegevens</h5>
                        </div>
                        <div className="item-content">
                            {algemeneDataState.isLoading && <div>Laden van items...</div>}
                            {algemeneDataState.error && <div>Fout: {algemeneDataState.error}</div>}
                            {algemeneDataState.data && renderContent(algemeneDataState.data)}
                        </div>
                    </section>

                    {/* Item 2: Persoonlijk */}
                    <section className={getItemClass('persoonlijk')}>
                        <div className="item-header" onClick={() => handleHeaderClick('persoonlijk')}>
                            <h5>2. persoonlijke gegevens</h5>
                        </div>
                        <div className="item-content">
                            {persoonlijkeDataState.isLoading && <div>Laden van items...</div>}
                            {persoonlijkeDataState.error && <div>Fout: {persoonlijkeDataState.error}</div>}
                            {persoonlijkeDataState.data && renderContent(persoonlijkeDataState.data)}
                        </div>
                    </section>

                    {/* Item 3: Cookies */}
                    <section className={getItemClass('cookies')}>
                        <div className="item-header" onClick={() => handleHeaderClick('cookies')}>
                            <h5>3. cookies en derde partijen</h5>
                        </div>
                        <div className="item-content">
                            {cookiesDataState.isLoading && <div>Laden van items...</div>}
                            {cookiesDataState.error && <div>Fout: {cookiesDataState.error}</div>}
                            {cookiesDataState.data && renderContent(cookiesDataState.data)}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
