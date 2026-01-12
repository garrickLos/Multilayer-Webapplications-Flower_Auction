// import index types
import type {ContentBlock} from '../../privacyBeleid/Componenten/index'

export const renderContent = (items: ContentBlock[]) => {
    if (!items || items.length === 0) return <div>Geen items gevonden.</div>;

    return items.map((item, index) => {
        // als de type een 'paragraaph' is maakt hij een paragraaph ervan
        if (item.type === 'paragraph') {
            return <PrivacyItems key={index} paragraph={item.content as string} />;
        }
        
        // als de type een 'list' is dan genereert hij een list item erdoorheen
        if (item.type === 'list') {
            return <PrivacyItems key={index} list={item.content as string[]} />;
        }

        return null;
    });
};

// genereert een lijst als het nodig is. 
const PrivacyItems: React.FC<{ paragraph?: string; list?: string[] }> = ({ paragraph, list }) => {
    if (paragraph) return <p>{paragraph}</p>;
    
    if (list) {
        return (
            <ul>
                {list.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        );
    }
    return null;
};