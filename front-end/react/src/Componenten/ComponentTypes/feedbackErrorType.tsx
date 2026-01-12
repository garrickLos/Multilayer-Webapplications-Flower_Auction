import type { errorMessaging } from "../../schermen/Veilingscherm/VeilingSchermComponenten/index";

export interface feedbackError {
    isCorrect: boolean
    err: errorMessaging
}
