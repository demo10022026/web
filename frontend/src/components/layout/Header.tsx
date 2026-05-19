import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate }           from 'react-router-dom'
import {
  ShoppingBag, Search, Bell, Tag, ShoppingCart,
  User, LogOut, ChevronDown, Store, Clock,
  LayoutDashboard, Package,
} from 'lucide-react'
import { useAuthStore }   from '@/store/authStore'
import { useSellerStore } from '@/store/sellerStore'
import { useCartStore }   from '@/store/cartStore'
import { authApi }        from '@/api/authApi'
import toast              from 'react-hot-toast'

export default function Header() {
  const { user, isAuthenticated, clearAuth, refreshToken } = useAuthStore()
  const { status: sellerStatus, shopId, shopName }         = useSellerStore()
  const { itemCount: cartCount }                            = useCartStore()

  const [search,       setSearch]       = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef                     = useRef<HTMLDivElement>(null)
  const navigate                        = useNavigate()

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'
  const canShowSellerEntry = !isAuthenticated || !isAdminOrManager
  const canShowSellerMenu = isAuthenticated && !isAdminOrManager

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
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`)
  }

  const handleLogout = async () => {
    try { if (refreshToken) await authApi.logout(refreshToken) } finally {
      clearAuth()
      navigate('/login')
      toast.success('Đã đăng xuất')
    }
  }

  return (
    <header className="bg-orange-500 text-white sticky top-0 z-40 shadow-md">

      {/* ── Mini top bar ── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 py-1 justify-end gap-4
                      text-xs text-orange-100 border-b border-orange-400/50">
        {canShowSellerEntry && (
            <>
              {sellerStatus === 'none' || !isAuthenticated ? (
                  <Link to="/become-seller" className="hover:text-white transition-colors">
                    Bán hàng cùng ShopVN
                  </Link>
              ) : sellerStatus === 'pending' ? (
                  <Link to="/seller/status" className="hover:text-white transition-colors">
                    ⏳ Hồ sơ đang chờ duyệt
                  </Link>
              ) : sellerStatus === 'rejected' ? (
                  <Link to="/seller/status" className="hover:text-white transition-colors">
                    Hồ sơ seller bị từ chối
                  </Link>
              ) : sellerStatus === 'approved' ? (
                  <Link
                      to={shopId ? '/seller/dashboard' : '/seller/shop/setup'}
                      className="hover:text-white transition-colors"
                  >
                    🏪 {shopId ? shopName ?? 'Quản lý Shop' : 'Tạo Shop'}
                  </Link>
              ) : null}

              <span className="opacity-30">|</span>
            </>
        )}
        <Link to="/help" className="hover:text-white transition-colors">Hỗ trợ</Link>
      </div>

      {/* ── Main bar ── */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <ShoppingBag className="h-7 w-7" />
          <span className="text-xl font-bold tracking-tight">ShopVN</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex items-center bg-white rounded-lg overflow-hidden shadow-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu, shop..."
              className="flex-1 px-4 py-2 text-gray-800 text-sm outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="bg-orange-400 hover:bg-orange-300 px-4 py-2 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Icons */}
        <div className="flex items-center gap-0.5 shrink-0">

          {/* Thông báo */}
          <button className="relative p-2 hover:bg-orange-400/60 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </button>

          {/* Voucher */}
          <Link to="/vouchers"
            className="p-2 hover:bg-orange-400/60 rounded-lg transition-colors"
            title="Mã giảm giá">
            <Tag className="h-5 w-5" />
          </Link>

          {/* Giỏ hàng */}
          <Link to="/cart"
            className="relative p-2 hover:bg-orange-400/60 rounded-lg transition-colors"
            title="Giỏ hàng">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px]
                               font-bold min-w-[16px] h-4 rounded-full flex items-center
                               justify-center px-0.5 leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* ── User dropdown ── */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-orange-400/60
                           rounded-lg transition-colors"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar"
                    className="w-7 h-7 rounded-full object-cover border border-white/30" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <span className="text-sm font-medium max-w-[80px] truncate hidden sm:block">
                  {user?.fullName?.split(' ').pop()}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200
                  ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl
                                shadow-xl border border-gray-100 overflow-hidden
                                text-gray-700 z-50 animate-in fade-in slide-in-from-top-2
                                duration-150">

                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    {/* Seller badge */}
                    {canShowSellerMenu && sellerStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px]
                                       bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                        <Clock className="h-2.5 w-2.5" /> Chờ duyệt seller
                      </span>
                    )}
                    {canShowSellerMenu && sellerStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px]
                                       bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                        <Store className="h-2.5 w-2.5" /> Seller
                      </span>
                    )}
                  </div>

                  {/* ── User links ── */}
                  <div className="py-1">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      Thông tin cá nhân
                    </Link>
                    <Link to="/orders" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-sm">
                      <ShoppingBag className="h-4 w-4 text-gray-400" />
                      Đơn mua của tôi
                    </Link>
                  </div>

                  {/* ── Seller links ── */}
                  {/* ── Seller links ── */}
                  {canShowSellerMenu && (
                      <div className="border-t border-gray-100 py-1">

                        {/* Chưa đăng ký */}
                        {sellerStatus === 'none' && (
                            <Link
                                to="/become-seller"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5
                   hover:bg-orange-50 text-sm text-orange-600 font-medium"
                            >
                              <Store className="h-4 w-4" />
                              Bán hàng cùng ShopVN
                            </Link>
                        )}

                        {/* Đang chờ duyệt */}
                        {sellerStatus === 'pending' && (
                            <Link
                                to="/seller/status"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5
                   hover:bg-yellow-50 text-sm text-yellow-700"
                            >
                              <Clock className="h-4 w-4" />
                              Hồ sơ đang chờ duyệt
                            </Link>
                        )}

                        {/* Bị từ chối */}
                        {sellerStatus === 'rejected' && (
                            <Link
                                to="/seller/status"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5
                   hover:bg-red-50 text-sm text-red-600"
                            >
                              <Store className="h-4 w-4" />
                              Xem trạng thái hồ sơ seller
                            </Link>
                        )}

                        {/* Đã được duyệt */}
                        {sellerStatus === 'approved' && (
                            <>
                              <Link
                                  to={shopId ? '/seller/dashboard' : '/seller/shop/setup'}
                                  onClick={() => setDropdownOpen(false)}
                                  className="flex items-center gap-2.5 px-4 py-2.5
                     hover:bg-orange-50 text-sm text-orange-600 font-medium"
                              >
                                <Store className="h-4 w-4" />
                                {shopId ? 'Quản lý Shop' : 'Tạo Shop ngay'}
                              </Link>

                              {shopId && (
                                  <Link
                                      to="/seller/products/new"
                                      onClick={() => setDropdownOpen(false)}
                                      className="flex items-center gap-2.5 px-4 py-2.5
                       hover:bg-orange-50 text-sm text-gray-600"
                                  >
                                    <Package className="h-4 w-4 text-gray-400" />
                                    Thêm sản phẩm
                                  </Link>
                              )}
                            </>
                        )}
                      </div>
                  )}

                  {/* ── Admin links ── */}
                  {isAdminOrManager && (
                    <div className="border-t border-gray-100 py-1">
                      <Link to="/admin" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5
                                   hover:bg-blue-50 text-sm text-blue-600">
                        <LayoutDashboard className="h-4 w-4" />
                        Quản trị hệ thống
                      </Link>
                    </div>
                  )}

                  {/* ── Logout ── */}
                  <div className="border-t border-gray-100 py-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5
                                 hover:bg-red-50 text-sm text-red-500">
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            /* Chưa đăng nhập */
            <div className="flex items-center gap-1 ml-1">
              <Link to="/login"
                className="px-3 py-1.5 text-sm hover:bg-orange-400/60 rounded-lg transition-colors">
                Đăng nhập
              </Link>
              <Link to="/register"
                className="px-3 py-1.5 text-sm bg-white text-orange-500 font-semibold
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
