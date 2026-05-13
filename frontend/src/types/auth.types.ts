export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errorCode?: string
  timestamp: string
}

export interface UserInfo {
  userId: number
  username: string
  fullName: string
  email: string
  phoneNumber: string
  avatarUrl?: string
  role: 'user' | 'admin' | 'manager'
  emailVerified: boolean
  phoneVerified: boolean
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
