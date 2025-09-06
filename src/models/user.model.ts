import Database from 'libsql'
import { v4 as uuidv4 } from 'uuid'

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
  } catch (e) {
    let message
    if (e instanceof Error) message = e.message
    throw new Error('error db: ' + message)
  }
}

export class UserModel {
  //

  static allActiveUsers = () => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    return db.prepare('SELECT * FROM users WHERE status = ?').all(1) as Array<{
      id: string
      name: string
      status: number
    }>
  }

  //

  static allUsers = () => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    return db.prepare('SELECT * FROM users').all() as Array<{
      id: string
      name: string
      status: number
    }>
  }

  //

  static create = ({ name }: { name: string }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    try {
      const id = uuidv4()
      db.prepare(
        'INSERT INTO users (id, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
      ).get(id, name, 1, new Date().toISOString(), new Date().toISOString())
      return id
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not insert: ' + message)
    }
  }

  //

  static find = ({ id }: { id: string }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as {
      id: string
      name: string
      status: number
    }
  }

  static findByName = ({ name }: { name: string }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    return db.prepare('SELECT * FROM users WHERE name = ?').get(name) as {
      id: string
      name: string
      status: number
    }
  }

  //

  static findByNameStatus = ({
    name,
    status
  }: {
    name: string
    status: number
  }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    return db
      .prepare('SELECT * FROM users WHERE name = ? AND status = ?')
      .get(name, status) as {
      id: string
      name: string
      status: number
    }
  }

  //

  static updateStatus = ({ id, status }: { id: string; status: number }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    try {
      db.prepare('UPDATE users SET status = ?, updatedAt = ? WHERE id = ?').get(
        status,
        new Date().toISOString(),
        id
      )
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not update: ' + message)
    }
  }

  static updateStatusByName = ({
    name,
    status
  }: {
    name: string
    status: number
  }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    try {
      db.prepare(
        'UPDATE users SET status = ?, updatedAt = ? WHERE name = ?'
      ).get(status, new Date().toISOString(), name)
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not update: ' + message)
    }
  }

  //

  static delete = ({ id }: { id: string }) => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    try {
      db.prepare('DELETE FROM users WHERE id = ?').get(id)
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not delete: ' + message)
    }
  }

  static deleteAll = () => {
    let db
    try {
      db = connectUsers()
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not connect: ' + message)
    }

    try {
      db.exec('DELETE FROM users')
    } catch (e: unknown) {
      let message
      if (e instanceof Error) message = e.message
      throw new Error('can not delete all: ' + message)
    }
  }

  //
}
