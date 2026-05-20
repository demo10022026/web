import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingBag,
  Search,
  Bell,
  Tag,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Store,
  Clock,
  LayoutDashboard,
  Package,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSellerStore } from '@/store/sellerStore'
import { useCartStore } from '@/store/cartStore'
import { authApi } from '@/api/authApi'
import { sellerShopApi } from '@/api/sellerShopApi'
import toast from 'react-hot-toast'

export default function Header() {
  const { user, isAuthenticated, clearAuth, refreshToken } = useAuthStore()

  const {
    status: sellerStatus,
    shopId,
    shopName,
    setShop,
  } = useSellerStore()

  const { itemCount: cartCount } = useCartStore()

  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'
  const canShowSellerEntry = !isAuthenticated || !isAdminOrManager
  const canShowSellerMenu = isAuthenticated && !isAdminOrManager

  const { data: myShop } = useQuery({
    queryKey: ['sellerMyShop'],
    queryFn: sellerShopApi.getMyShop,
    enabled:
        isAuthenticated &&
        !isAdminOrManager &&
        sellerStatus === 'approved',
    retry: false,
    staleTime: 0,
  })

  useEffect(() => {
    if (myShop) {
      setShop(myShop.shopId, myShop.shopName, myShop.shopSlug)
    }
  }, [myShop, setShop])

  const currentShopId = myShop?.shopId ?? shopId
  const currentShopName = myShop?.shopName ?? shopName

  const sellerShopTarget = currentShopId
      ? '/seller/dashboard'
      : '/seller/shop/setup'

  const sellerShopLabel = currentShopId
      ? 'Quản lý cửa hàng của bạn'
      : 'Tạo Shop'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)

    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()

    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } finally {
      clearAuth()
      navigate('/login')
      toast.success('Đã đăng xuất')
    }
  }

  return (
      <header className="sticky top-0 z-40 bg-orange-500 text-white shadow-md">
        <div className="mx-auto hidden max-w-7xl justify-end gap-4 border-b border-orange-400/50 px-4 py-1 text-xs text-orange-100 md:flex">
          {canShowSellerEntry && (
              <>
                {sellerStatus === 'none' || !isAuthenticated ? (
                    <Link
                        to="/become-seller"
                        className="transition-colors hover:text-white"
                    >
                      Bán hàng cùng ShopVN
                    </Link>
                ) : sellerStatus === 'pending' ? (
                    <Link
                        to="/seller/status"
                        className="transition-colors hover:text-white"
                    >
                      ⏳ Hồ sơ đang chờ duyệt
                    </Link>
                ) : sellerStatus === 'rejected' ? (
                    <Link
                        to="/seller/status"
                        className="transition-colors hover:text-white"
                    >
                      Hồ sơ seller bị từ chối
                    </Link>
                ) : sellerStatus === 'approved' ? (
                    <Link
                        to={sellerShopTarget}
                        className="transition-colors hover:text-white"
                    >
                      🏪{' '}
                      {currentShopId
                          ? currentShopName ?? 'Quản lý cửa hàng của bạn'
                          : 'Tạo Shop'}
                    </Link>
                ) : null}

                <span className="opacity-30">|</span>
              </>
          )}

          <Link to="/help" className="transition-colors hover:text-white">
            Hỗ trợ
          </Link>
        </div>

        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex shrink-0 items-center gap-1.5">
            <ShoppingBag className="h-7 w-7" />
            <span className="text-xl font-bold tracking-tight">ShopVN</span>
          </Link>

          <form onSubmit={handleSearch} className="max-w-2xl flex-1">
            <div className="flex items-center overflow-hidden rounded-lg bg-white shadow-sm">
              <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm, thương hiệu, shop..."
                  className="flex-1 px-4 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />

              <button
                  type="submit"
                  className="bg-orange-400 px-4 py-2 transition-colors hover:bg-orange-300"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-0.5">
            <button className="relative rounded-lg p-2 transition-colors hover:bg-orange-400/60">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400" />
            </button>

            <Link
                to="/vouchers"
                className="rounded-lg p-2 transition-colors hover:bg-orange-400/60"
                title="Mã giảm giá"
            >
              <Tag className="h-5 w-5" />
            </Link>

            <Link
                to="/cart"
                className="relative rounded-lg p-2 transition-colors hover:bg-orange-400/60"
                title="Giỏ hàng"
            >
              <ShoppingCart className="h-5 w-5" />

              {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
              )}
            </Link>

            {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-orange-400/60"
                  >
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt="avatar"
                            className="h-7 w-7 rounded-full border border-white/30 object-cover"
                        />
                    ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                          <User className="h-4 w-4" />
                        </div>
                    )}

                    <span className="hidden max-w-[80px] truncate text-sm font-medium sm:block">
                  {user?.fullName?.split(' ').pop()}
                </span>

                    <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            dropdownOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {dropdownOpen && (
                      <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white text-gray-700 shadow-xl duration-150">
                        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {user?.fullName}
                          </p>

                          <p className="truncate text-xs text-gray-400">
                            {user?.email}
                          </p>

                          {canShowSellerMenu && sellerStatus === 'pending' && (
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">
                        <Clock className="h-2.5 w-2.5" />
                        Chờ duyệt seller
                      </span>
                          )}

                          {canShowSellerMenu && sellerStatus === 'approved' && (
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                        <Store className="h-2.5 w-2.5" />
                        Seller
                      </span>
                          )}
                        </div>

                        <div className="py-1">
                          <Link
                              to="/profile"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50"
                          >
                            <User className="h-4 w-4 text-gray-400" />
                            Thông tin cá nhân
                          </Link>

                          <Link
                              to="/orders"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50"
                          >
                            <ShoppingBag className="h-4 w-4 text-gray-400" />
                            Đơn mua của tôi
                          </Link>
                        </div>

                        {canShowSellerMenu && (
                            <div className="border-t border-gray-100 py-1">
                              {sellerStatus === 'none' && (
                                  <Link
                                      to="/become-seller"
                                      onClick={() => setDropdownOpen(false)}
                                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
                                  >
                                    <Store className="h-4 w-4" />
                                    Bán hàng cùng ShopVN
                                  </Link>
                              )}

                              {sellerStatus === 'pending' && (
                                  <Link
                                      to="/seller/status"
                                      onClick={() => setDropdownOpen(false)}
                                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50"
                                  >
                                    <Clock className="h-4 w-4" />
                                    Hồ sơ đang chờ duyệt
                                  </Link>
                              )}

                              {sellerStatus === 'rejected' && (
                                  <Link
                                      to="/seller/status"
                                      onClick={() => setDropdownOpen(false)}
                                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Store className="h-4 w-4" />
                                    Xem trạng thái hồ sơ seller
                                  </Link>
                              )}

                              {sellerStatus === 'approved' && (
                                  <>
                                    <Link
                                        to={sellerShopTarget}
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
                                    >
                                      <Store className="h-4 w-4" />
                                      {sellerShopLabel}
                                    </Link>

                                    {currentShopId && (
                                        <Link
                                            to="/seller/products/new"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50"
                                        >
                                          <Package className="h-4 w-4 text-gray-400" />
                                          Thêm sản phẩm
                                        </Link>
                                    )}
                                  </>
                              )}
                            </div>
                        )}

                        {isAdminOrManager && (
                            <div className="border-t border-gray-100 py-1">
                              <Link
                                  to="/admin"
                                  onClick={() => setDropdownOpen(false)}
                                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50"
                              >
                                <LayoutDashboard className="h-4 w-4" />
                                Quản trị hệ thống
                              </Link>
                            </div>
                        )}

                        <div className="border-t border-gray-100 py-1">
                          <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                  )}
                </div>
            ) : (
                <div className="ml-1 flex items-center gap-1">
                  <Link
                      to="/login"
                      className="rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-orange-400/60"
                  >
                    Đăng nhập
                  </Link>

                  <Link
                      to="/register"
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-orange-500 transition-colors hover:bg-orange-50"
                  >
                    Đăng ký
                  </Link>
                </div>
            )}
          </div>
        </div>
      </header>
  )
}