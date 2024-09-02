import { PrismaClient } from '@prisma/client'
import sqlite from 'better-sqlite3'
import type { User, Todo, CreateUser, FindUser, CreateTodo, FindAllTodos, DeleteTodo } from '$lib/types'

export const client = new PrismaClient()
export const db = sqlite('./prisma/sqlite.db')

export const createUser: CreateUser = async (user: User): Promise<User> => {
  await client.user.deleteMany({ where: { email: user.email } })
  return await client.user.create({ data: user })
}

export const findUser: FindUser = async (id: string): Promise<User | null> => {
  return await client.user.findFirst({ where: { id } })
}

export const createTodo: CreateTodo = async (todo: Todo): Promise<Todo> => {
  return await client.todo.create({ data: todo })
}

export const findAllTodos: FindAllTodos = async (userId: string): Promise<Todo[]> => {
  return await client.todo.findMany({ where: { userId } })
}

export const deleteTodo: DeleteTodo = async (filter: { userId: string; id: string }): Promise<Todo | null> => {
  return await client.todo.delete({ where: filter })
}
