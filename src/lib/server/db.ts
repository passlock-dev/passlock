import sqlite from 'better-sqlite3'
import dedent from 'dedent'

export const db = sqlite('./sqlite.db')

const sql = dedent(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT NOT NULL PRIMARY KEY,
    email TEXT NOT NULL,
    given_name TEXT NOT NULL,
    family_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session (
    id TEXT NOT NULL PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
  );
`)

export const initLucia = () => {
  db.exec(sql)
}

export type CreateUser = {
  id: string
  email: string
  givenName: string
  familyName: string
}

export const createUser = (user: CreateUser) => {
  const insert = db.prepare(
    'INSERT INTO user (id, email, given_name, family_name) ' +
      'VALUES (@id, @email, @givenName, @familyName)'
  )

  insert.run(user)

  return user
}
