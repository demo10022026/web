import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// Layouts & Guards
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

// Auth pages
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'

// Public pages
import HomePage from '@/pages/HomePage'
import SearchPage from '@/pages/SearchPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import { FlashSalePage } from '@/pages/FlashSalePage'

// User pages
import ProfilePage from '@/pages/ProfilePage'

// Seller pages
import BecomeSellerPage from '@/pages/seller/BecomeSellerPage'

// Cart pages
import CartPage from '@/pages/CartPage'

// Admin
import AdminLayout from '@/components/admin/AdminLayout'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminProductDetailPage from '@/pages/admin/AdminProductDetailPage'

// ─────────────────────────────────────────────────────────────
// Placeholder pages — xoá khi có file thật
// ─────────────────────────────────────────────────────────────

const CheckoutPage = () => <ComingSoon title="Thanh toán" sprint={4} />
const OrdersPage = () => <ComingSoon title="Đơn hàng" sprint={4} />
const VouchersPage = () => <ComingSoon title="Voucher" sprint={4} />
const AddressesPage = () => <ComingSoon title="Địa chỉ" sprint={4} />

const SellerStatusPage = () => (
    <ComingSoon title="Trạng thái seller" sprint={2} />
)

const ShopSetupPage = () => (
    <ComingSoon title="Tạo shop" sprint={3} />
)

const SellerDashboardPage = () => (
    <ComingSoon title="Seller dashboard" sprint={3} />
)

const CreateProductPage = () => (
    <ComingSoon title="Thêm sản phẩm" sprint={4} />
)

// ─────────────────────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────────────────────

function ComingSoon({
                      title,
                      sprint,
                    }: {
  title: string
  sprint: number
}) {
  return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <span className="text-4xl mb-4">🚧</span>

        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          {title}
        </h2>

        <p className="text-sm text-gray-400">
          Tính năng này sẽ có ở Sprint {sprint}
        </p>
      </div>
  )
}

// ─────────────────────────────────────────────────────────────
// React Query
// ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────

export default function App() {
  return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>

            {/* ====================================================
              AUTH ROUTES
          ==================================================== */}

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
            />

            {/* ====================================================
              PUBLIC ROUTES
          ==================================================== */}

            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />

              <Route
                  path="/search"
                  element={<SearchPage />}
              />

              <Route
                  path="/products/:id"
                  element={<ProductDetailPage />}
              />

              <Route
                  path="/flash-sale"
                  element={<FlashSalePage />}
              />
            </Route>

            {/* ====================================================
              AUTHENTICATED USER ROUTES
          ==================================================== */}

            <Route element={<ProtectedRoute />}>

              <Route element={<MainLayout />}>

                {/* User */}
                <Route
                    path="/profile"
                    element={<ProfilePage />}
                />

                <Route
                    path="/cart"
                    element={<CartPage />}
                />

                <Route
                    path="/checkout"
                    element={<CheckoutPage />}
                />

                <Route
                    path="/orders"
                    element={<OrdersPage />}
                />

                <Route
                    path="/vouchers"
                    element={<VouchersPage />}
                />

                <Route
                    path="/addresses"
                    element={<AddressesPage />}
                />

                {/* Seller */}
                <Route
                    path="/become-seller"
                    element={<BecomeSellerPage />}
                />

                <Route
                    path="/seller/status"
                    element={<SellerStatusPage />}
                />

                <Route
                    path="/seller/shop/setup"
                    element={<ShopSetupPage />}
                />

                <Route
                    path="/seller/dashboard"
                    element={<SellerDashboardPage />}
                />

                <Route
                    path="/seller/products/new"
                    element={<CreateProductPage />}
                />

              </Route>
            </Route>

              {/* ── Admin / Manager ── */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                  <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Navigate to="/admin/products" replace />} />
                      <Route path="products" element={<AdminProductsPage />} />
                      <Route path="products/:productId" element={<AdminProductDetailPage />} />
                  </Route>
              </Route>

            {/* ====================================================
              FALLBACK
          ==================================================== */}

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />

          </Routes>
        </BrowserRouter>

        <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                fontSize: '14px',
              },
            }}
        />
      </QueryClientProvider>
  )
}