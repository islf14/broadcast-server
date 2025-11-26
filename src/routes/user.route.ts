import { Router, type Request, type Response } from 'express'
import { UserController } from '../controllers/user.controller.js'
import { join } from 'node:path'
import { rate } from '../middlewares/rate.middleware.js'

// "/"
export const userRouter = () => {
  const userController = new UserController()
  const userRouter = Router()
  const limit = { times: 3, minutes: 2 }
  // for viewing purposes only
  userRouter.get('/users', rate(limit), userController.users)
  // load the principal page
  userRouter.get('/', (_req: Request, res: Response) => {
    res.sendFile(join(process.cwd(), 'client/index.html'))
  })

  return userRouter
}
