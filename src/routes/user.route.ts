import { Router } from 'express'
import { UserController } from '../controllers/user.controller'

export const createUserRouter = () => {
  const userController = new UserController()

  const userRouter = Router()

  userRouter.post('/login', userController.login)
  userRouter.post('/vlogin', userController.vlogin)
  userRouter.get('/users', userController.users)

  return userRouter
}
