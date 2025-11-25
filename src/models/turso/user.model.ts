import { createClient } from '@libsql/client'
import { v4 as uuidv4 } from 'uuid'
import { Id, IdSt, Name, NaSt, ShowUser, UserDB } from '../../types.js'
import { dbAuthToken, dbUrl } from '../../constants.js'

async function connectUsers() {
  const db = createClient({ url: dbUrl, authToken: dbAuthToken })
  try {
    const tb = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    )
    if (tb.rows.length === 0) {
      await db.execute(
        'CREATE TABLE users (id BLOB PRIMARY KEY, name TEXT, status NUMERIC, createdAt TEXT, updatedAt TEXT)'
      )
    }
    return db
  } catch (e: unknown) {
    let m
    if (e instanceof Error) m = e.message
    throw new Error('db error: ' + m)
  }
}

export class UserModel {
  //
  // Used in UserController - logoutAll

  static allActiveUsers = async (): Promise<Array<UserDB>> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }
    const sql = 'SELECT * FROM users WHERE status = ?'
    const args = [1]
    const result = await db.execute({ sql, args })
    const data = result.rows as unknown as Array<UserDB>
    db.close()
    return data
  }

  // Used in UserController - getActiveUsers
  static nameActiveUsers = async (): Promise<Array<Name>> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }
    const sql = 'SELECT name FROM users WHERE status = ?'
    const args = [1]
    const result = await db.execute({ sql, args })
    const data = result.rows as unknown as Array<Name>
    db.close()
    return data
  }

  // Used in UserController - notifyDisconnection, closeChat

  static countAciveUsers = async (): Promise<number> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }
    const sql = 'SELECT COUNT(*) as count FROM users WHERE status = ?'
    const args = [1]
    const result = await db.execute({ sql, args })
    const data = result.rows[0] as unknown as { count: number }
    db.close()
    return data.count
  }

  // Used in UserController - users

  static allUsers = async (): Promise<Array<ShowUser>> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const sql = 'SELECT name, status, createdAt as date FROM users'
    const result = await db.execute({ sql })
    const data = result.rows as unknown as Array<ShowUser>
    db.close()
    return data
  }

  // Used in UserController - countAllUsers

  static countAllUsers = async (): Promise<number> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }
    const sql = 'SELECT COUNT(*) as count FROM users'
    const result = await db.execute({ sql })
    const data = result.rows[0] as unknown as { count: number }
    db.close()
    return data.count
  }

  // Used in UserController - login

  static create = async ({ name }: Name): Promise<string> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      const id = uuidv4()
      const sql =
        'INSERT INTO users (id, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
      const args = [
        id,
        name,
        1,
        new Date().toISOString(),
        new Date().toISOString()
      ]
      await db.execute({ sql, args })
      return id
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not insert: ' + m)
    } finally {
      db.close()
    }
  }

  // Used in UserController - getUser

  static find = async ({ id }: Id): Promise<Name> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const sql = 'SELECT name FROM users WHERE id = ?'
    const args = [id]
    const result = await db.execute({ sql, args })
    const data = result.rows[0] as unknown as Name
    db.close()
    return data
  }

  // Used in UserController - userAfter

  static findByName = async ({ name }: Name): Promise<UserDB | undefined> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const sql = 'SELECT * FROM users WHERE name = ?'
    const args = [name]
    const result = await db.execute({ sql, args })
    const data = result.rows[0] as unknown as UserDB
    db.close()
    return data
  }

  // Used in UserController - login

  static countUsersByName = async ({ name }: Name): Promise<number> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const sql = 'SELECT COUNT(*) as count FROM users WHERE name = ?'
    const args = [name]
    const result = await db.execute({ sql, args })
    const data = result.rows[0] as unknown as { count: number }
    db.close()
    return data.count
  }

  // Used in UserController - vlogin

  static findByNameStatus = async ({
    name,
    status
  }: NaSt): Promise<UserDB | undefined> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const sql = 'SELECT * FROM users WHERE name = ? AND status = ?'
    const args = [name, status]
    const result = await db.execute({ sql, args })
    const data = result.rows[0] as unknown as UserDB
    db.close()
    return data
  }

  // Used in UserController - vlogin, logoutAll

  static updateStatus = async ({ id, status }: IdSt): Promise<void> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      const sql = 'UPDATE users SET status = ?, updatedAt = ? WHERE id = ?'
      const args = [status, new Date().toISOString(), id]
      await db.execute({ sql, args })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not update: ' + m)
    } finally {
      db.close()
    }
  }

  // Used in UserController - logout

  static updateStatusByName = async ({ name, status }: NaSt): Promise<void> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      const sql = 'UPDATE users SET status = ?, updatedAt = ? WHERE name = ?'
      const args = [status, new Date().toISOString(), name]
      await db.execute({ sql, args })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not update: ' + m)
    } finally {
      db.close()
    }
  }

  // Used in UserController - deleteAll

  static deleteAll = async (): Promise<void> => {
    let db
    try {
      db = await connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      await db.execute({ sql: 'DELETE FROM users' })
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not delete all: ' + m)
    } finally {
      db.close()
    }
  }

  //
}
