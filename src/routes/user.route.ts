import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { Server } from 'socket.io'

export const createUserRouter = ({ io }: { io: Server }) => {
  const userController = new UserController({ io })

  const userRouter = Router()

  userRouter.post('/login', userController.login)
  userRouter.post('/vlogin', userController.vlogin)
  userRouter.get('/users', userController.users)

  return userRouter
}
