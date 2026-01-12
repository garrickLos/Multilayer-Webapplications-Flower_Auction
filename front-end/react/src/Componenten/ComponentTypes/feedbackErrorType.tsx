import type { errorMessaging } from "../../schermen/AuctionScreen/VeilingSchermComponenten/index";

export interface feedbackError {
    isCorrect: boolean
    err: errorMessaging
}