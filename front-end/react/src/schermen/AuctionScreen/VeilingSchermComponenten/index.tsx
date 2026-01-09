// index voor alle componenten en types voor de veilingscherm

export { ErrorScherm } from './ErrorComponent';

export { Laadscherm } from './Laadscherm';

export { mapVeilingData, mapInfoLijstData } from './VeilingSchermMapping';

export { VeilingProductitem_Update } from './VeilingScherm_InfoConfig';

export { ContainerSideMenu } from './OffcanvasComponent';

export { Timer, berekenHuidigeVeilingStaat } from '../VeilingSchermComponenten/RenderTimer';


// voor de types van de veilingScherm

export type { NieuweBieding } from './VeilingSchermTypes/BiedingTypes';

export type { VeilingproductUpdate, VeilingTijdUpdate } from './VeilingSchermTypes/VeilingTypes';

export type { MyTokenPayload } from './VeilingSchermTypes/TokenPayloadTypes';

export type { PrijsHistorieItemLogica, PrijsHistorieResultaatLogica, ContainerSideMenuProps } from './VeilingSchermTypes/PrijsHistoryTypes';

export type { ProductLogica, VeilingLogica, categorie, VeilingschermProps, errorMessaging } from './VeilingSchermTypes/VeilingSchermTypes';

export type { TimerProps } from './VeilingSchermTypes/TimerType';