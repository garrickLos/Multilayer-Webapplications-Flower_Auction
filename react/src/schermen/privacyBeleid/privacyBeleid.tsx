import { useState } from 'react'; // 1. Importeer useState
import { useFetchDatajson } from '../../typeScript/jsonOphalen';

import '../../css/privacybeleidStylesheet.css';

const url = "src/resources/json/privacyBeleid.json";

export default function PrivacyScherm() {
    const [openItemId, setOpenItemId] = useState<string | null>(null);

    const algemeneDataState = useFetchDatajson<PrivacyItemProps>(
        "algemene gegevens", url
    );

    const persoonlijkeDataState = useFetchDatajson<PrivacyItemProps>(
        "persoonlijke gegevens", url
    );

    const cookiesDataState = useFetchDatajson<PrivacyItemProps>(
        "cookies", url
    );

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
                    <section className={getItemClass('algemeen')} onClick={() => handleHeaderClick('algemeen')}>
                        <div className="item-header" >
                            <h5>1. algemene gegevens</h5>
                        </div>
                        {openItemId === 'algemeen' && (
                            <div>
                                {algemeneDataState.isLoading && <div>Laden van items...</div>}
                                {algemeneDataState.error && <div>Fout: {algemeneDataState.error}</div>}
                                {/*{!algemeneDataState.isLoading && !algemeneDataState.error && renderContent(algemeneDataState.data)}*/}
                            </div>
                        )}

                    </section>

                    {/* Item 2: Persoonlijke Gegevens */}
                    <section className={getItemClass('persoonlijk')} onClick={() => handleHeaderClick('persoonlijk')}>
                        <div className="item-header">
                            <h5>2. persoonlijke gegevens</h5>
                        </div>
                        {openItemId === 'persoonlijk' && (
                            <div>
                                {persoonlijkeDataState.isLoading && <div>Laden van items...</div>}
                                {persoonlijkeDataState.error && <div>Fout: {persoonlijkeDataState.error}</div>}
                                {/*{!persoonlijkeDataState.isLoading && !persoonlijkeDataState.error && renderContent(persoonlijkeDataState.data)}*/}
                            </div>
                        )}

                    </section>

                    {/* Item 3: Cookies */}
                    <section className={getItemClass('cookies')}>
                        <div className="item-header" onClick={() => handleHeaderClick('cookies')}>
                            <h5>3. cookies en derde partijen</h5>
                        </div>
                        {openItemId === 'cookies' && (
                            <div>
                                {cookiesDataState.isLoading && <div>Laden van items...</div>}
                                {cookiesDataState.error && <div>Fout: {cookiesDataState.error}</div>}
                                {/*{!cookiesDataState.isLoading && !cookiesDataState.error && renderContent(cookiesDataState.data)}*/}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

interface ContentBlock {
    type: 'paragraph' | 'list';
    content: string | string[]; // Content is een string OF een array van strings
}

interface PrivacyItemProps {
    paragraph?: string;
    list?: string[];
}

// Component om te renderen
const PrivacyItems: React.FC<PrivacyItemProps> = ({ paragraph, list }) => {
    if (paragraph) {
        return <div><p>{paragraph}</p></div>;
    }
    if (list) {
        return (
            <div>
                <ul>
                    {list.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
        );
    }
    return null;
};

// De render-functie (verwacht de "Ideale" structuur)
const renderContent = (items: ContentBlock[]) => {
    if (!items || items.length === 0) return <div>Geen items gevonden.</div>;

    return items.map((item, index) => {
        switch (item.type) {
            case 'paragraph':
                return (
                    <PrivacyItems
                        key={index}
                        paragraph={item.content as string}
                    />
                );
            case 'list':
                return (
                    <PrivacyItems
                        key={index}
                        list={item.content as string[]}
                    />
                );
            default:
                return null;
        }
    });
};