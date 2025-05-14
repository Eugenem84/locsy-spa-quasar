import { setupWorker } from 'msw/browser'
import { handlers} from 'src/mocks/handlers.js'

export const worker = setupWorker(...handlers)
