export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errorCode?: string
  timestamp: string
}

export type UserRole = 'user' | 'seller' | 'admin' | 'manager'

export interface UserInfo {
  userId: number
  email: string
  fullName: string
  phone?: string
  role: UserRole
  accountStatus: 'active' | 'inactive' | 'banned'
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserInfo
}

export interface RegisterRequest {
  username: string
  fullName: string
  email: string
  phoneNumber: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthState {
  user: UserInfo | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (data: AuthResponse) => void
  updateUser: (user: Partial<UserInfo>) => void
  clearAuth: () => void
}
