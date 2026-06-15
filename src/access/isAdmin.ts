import type { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.includes('admin'))
}

export const isAuthenticated: Access = ({ req: { user } }) => {
  return Boolean(user)
}
