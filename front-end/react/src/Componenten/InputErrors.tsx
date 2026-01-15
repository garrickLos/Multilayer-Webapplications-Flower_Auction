import type { feedbackError } from '../Componenten/index';

/**
 * Klein helper component om feedback te tonen bij een invoerveld.
 * - Als isCorrect = false: toon de foutmelding (verkeerde waarde)
 * - Als isCorrect = true: toon eventueel de correcte waarde/feedback
 */
export function FeedbackError({ isCorrect, err }: feedbackError) {
    // Bij onjuiste invoer: toon error tekst in error-styling
    if (!isCorrect) {
        return <p className='AuctionScreen_errorInput'>{err?.verkeerdeWaarde}</p>;
    }

    // Bij juiste invoer: toon (optioneel) de correcte waarde/feedback
    return <p>{err?.correcteWaarde}</p>;
}
