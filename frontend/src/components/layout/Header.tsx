import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Search, Bell, Tag, ShoppingCart,
  User, LogOut, Settings, ChevronDown, LayoutDashboard
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/authApi'
import toast from 'react-hot-toast'

export default function Header() {
  const { user, isAuthenticated, clearAuth, refreshToken } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } finally {
      clearAuth()
      navigate('/login')
      toast.success('Đã đăng xuất')
    }
  }

  return (
    <header className="bg-orange-500 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <ShoppingBag className="h-7 w-7" />
          <span className="text-xl font-bold tracking-tight">ShopVN</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex items-center bg-white rounded-lg overflow-hidden">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="flex-1 px-4 py-2 text-gray-800 text-sm outline-none placeholder:text-gray-400"
            />
            <button type="submit"
              className="bg-orange-400 hover:bg-orange-300 px-4 py-2 transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Thông báo */}
          <button className="relative p-2 hover:bg-orange-400 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
          </button>

          {/* Mã giảm giá */}
          <Link to="/vouchers"
            className="relative p-2 hover:bg-orange-400 rounded-lg transition-colors"
            title="Mã giảm giá">
            <Tag className="h-5 w-5" />
          </Link>

          {/* Giỏ hàng */}
          <Link to="/cart"
            className="relative p-2 hover:bg-orange-400 rounded-lg transition-colors"
            title="Giỏ hàng">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px]
                             font-bold w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </Link>

          {/* User */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-orange-400
                           rounded-lg transition-colors">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar"
                    className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
                <span className="text-sm font-medium max-w-[90px] truncate">
                  {user?.fullName?.split(' ').pop()}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl
                                shadow-lg border border-gray-100 overflow-hidden text-gray-700">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>

                  <Link to="/profile" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-orange-50 text-sm">
                    <User className="h-4 w-4 text-orange-400" />
                    Thông tin cá nhân
                  </Link>

                  <Link to="/orders" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-orange-50 text-sm">
                    <ShoppingBag className="h-4 w-4 text-orange-400" />
                    Đơn hàng của tôi
                  </Link>

                  {/* Chỉ hiển thị cho admin/manager */}
                  {isManager && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <Link to="/admin" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-blue-50 text-sm text-blue-600">
                        <LayoutDashboard className="h-4 w-4" />
                        Quản lý hệ thống
                      </Link>
                    </>
                  )}

                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50
                               text-sm text-red-500">
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Link to="/login"
                className="px-3 py-1.5 text-sm hover:bg-orange-400 rounded-lg transition-colors">
                Đăng nhập
              </Link>
              <Link to="/register"
                className="px-3 py-1.5 text-sm bg-white text-orange-500 font-medium
                           rounded-lg hover:bg-orange-50 transition-colors">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
