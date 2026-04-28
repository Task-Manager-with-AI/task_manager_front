export interface User {
  id: string
  name: string
  email: string
  roleId: number
  isActive: boolean
  createdAt: string
  role?: { name: string }
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  name: string
  email: string
  password: string
}
