export type User = {
  id: string
  email: string
  givenName: string
  familyName: string
}

export type Todo = {
  id: string
  userId: string
  text: string
}

export type CreateUser = (user: User) => Promise<User>

export type FindUser = (id: string) => Promise<User | null>

export type CreateTodo = (todo: Todo) => Promise<Todo>

export type FindAllTodos = (userId: string) => Promise<Todo[]>

export type DeleteTodo = (filter: { userId: string; id: string }) => Promise<Todo | null>