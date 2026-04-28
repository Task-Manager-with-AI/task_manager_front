export interface User {
  id: string
  name: string
  email: string
  roleId: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
  role?: { name: string }
}
