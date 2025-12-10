import type { errorMessaging } from "../VeilingScherm"

interface feedbackError {
    isCorrect: boolean
    err: errorMessaging
}

export function FeedbackError ({isCorrect, err}: feedbackError) {
    if (!isCorrect) {
        return <p className='AuctionScreen_errorInput'>{err?.verkeerdeWaarde}</p>
    } else {
        return <p>{err?.correcteWaarde}</p>
    }
}