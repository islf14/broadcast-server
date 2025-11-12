import { type NextFunction, type Request, type Response } from 'express'
export function ecors() {
  return function (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Check if the error is from the CORS middleware
    if (err && err.message === 'Not allowed by CORS') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'This origin is not allowed by the CORS policy.'
      })
    } else {
      // Pass other errors down the chain
      next(err)
    }
  }
}
