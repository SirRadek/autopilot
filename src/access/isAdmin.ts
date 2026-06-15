import type { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.includes('admin'))
}

export const isAdminOrEditor: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.some((role) => role === 'admin' || role === 'editor'))
}

export const isAuthenticated: Access = ({ req: { user } }) => {
  return Boolean(user)
}

export const denyAccess: Access = () => false
