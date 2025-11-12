import Database from 'libsql'
import { v4 as uuidv4 } from 'uuid'
import { Id, IdSt, Name, NaSt, UserDB } from '../types.js'

function connectUsers() {
  const db = new Database('./data.db')
  try {
    const tb = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      )
      .get()
    if (tb === undefined) {
      db.exec(
        'CREATE TABLE users (id BLOB PRIMARY KEY, name TEXT, status NUMERIC, createdAt TEXT, updatedAt TEXT)'
      )
    }
    return db
  } catch (e: unknown) {
    let m
    if (e instanceof Error) m = e.message
    throw new Error('error db: ' + m)
  }
}

export class UserModel {
  //

  static allActiveUsers = () => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const result = db
      .prepare('SELECT * FROM users WHERE status = ?')
      .all(1) as Array<UserDB>
    db.close()
    return result
  }

  //

  static allUsers = () => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const result = db.prepare('SELECT * FROM users').all() as Array<UserDB>
    db.close()
    return result
  }

  //

  static create = ({ name }: Name) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      const id = uuidv4()
      db.prepare(
        'INSERT INTO users (id, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
      ).get(id, name, 1, new Date().toISOString(), new Date().toISOString())
      return id
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not insert: ' + m)
    } finally {
      db.close()
    }
  }

  //

  static find = ({ id }: Id) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const result = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as UserDB
    db.close()
    return result
  }

  static findByName = ({ name }: Name) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const result = db
      .prepare('SELECT * FROM users WHERE name = ?')
      .get(name) as UserDB
    db.close()
    return result
  }

  //

  static findByNameStatus = ({ name, status }: NaSt) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    const result = db
      .prepare('SELECT * FROM users WHERE name = ? AND status = ?')
      .get(name, status) as UserDB
    db.close()
    return result
  }

  //

  static updateStatus = ({ id, status }: IdSt) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      db.prepare('UPDATE users SET status = ?, updatedAt = ? WHERE id = ?').get(
        status,
        new Date().toISOString(),
        id
      )
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not update: ' + m)
    } finally {
      db.close()
    }
  }

  static updateStatusByName = ({ name, status }: NaSt) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      db.prepare(
        'UPDATE users SET status = ?, updatedAt = ? WHERE name = ?'
      ).get(status, new Date().toISOString(), name)
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not update: ' + m)
    } finally {
      db.close()
    }
  }

  //

  static delete = ({ id }: Id) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      db.prepare('DELETE FROM users WHERE id = ?').get(id)
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not delete: ' + m)
    } finally {
      db.close()
    }
  }

  static deleteAll = () => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let m
      if (e instanceof Error) m = e.message
      throw new Error('can not connect: ' + m)
    }

    try {
      db.exec('DELETE FROM users')
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
