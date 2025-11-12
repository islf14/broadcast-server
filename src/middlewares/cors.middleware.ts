import cors from 'cors'
import type { StaticOrigin } from '../types.js'
import { appOrigin, port } from '../constants.js'

const ACCEPTED_ORIGINS = [`http://localhost:${port}`, appOrigin]

export const corsMiddleware = () => {
  return cors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, origin?: StaticOrigin) => void
    ) {
      if (!origin || ACCEPTED_ORIGINS.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  })
}
