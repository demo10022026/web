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
import SellerStatusPage from '@/pages/seller/SellerStatusPage'
import SellerProtectedRoute from '@/components/ui/SellerProtectedRoute'
import AdminSellerDetailPage from '@/pages/admin/AdminSellerDetailPage'

// Cart pages
import CartPage from '@/pages/CartPage'

// Admin
import AdminLayout from '@/components/admin/AdminLayout'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminProductDetailPage from '@/pages/admin/AdminProductDetailPage'
import AdminSellersPage from '@/pages/admin/AdminSellersPage'

// Placeholder pages
const CheckoutPage = () => <ComingSoon title="Thanh toán" sprint={4} />
const OrdersPage = () => <ComingSoon title="Đơn hàng" sprint={4} />
const VouchersPage = () => <ComingSoon title="Voucher" sprint={4} />
const AddressesPage = () => <ComingSoon title="Địa chỉ" sprint={4} />

const ShopSetupPage = () => <ComingSoon title="Tạo shop" sprint={3} />
const SellerDashboardPage = () => <ComingSoon title="Seller dashboard" sprint={3} />
const CreateProductPage = () => <ComingSoon title="Thêm sản phẩm" sprint={4} />

function ComingSoon({
                        title,
                        sprint,
                    }: {
    title: string
    sprint: number
}) {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
            <span className="mb-4 text-4xl">🚧</span>

            <h2 className="mb-1 text-lg font-semibold text-gray-700">
                {title}
            </h2>

            <p className="text-sm text-gray-400">
                Tính năng này sẽ có ở Sprint {sprint}
            </p>
        </div>
    )
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
})

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Public */}
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/products/:id" element={<ProductDetailPage />} />
                        <Route path="/flash-sale" element={<FlashSalePage />} />
                    </Route>

                    {/* User authenticated */}
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={['user', 'seller', 'admin', 'manager']} />
                        }
                    >
                        <Route element={<MainLayout />}>
                            <Route path="/profile" element={<ProfilePage />} />

                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/orders" element={<OrdersPage />} />
                            <Route path="/vouchers" element={<VouchersPage />} />
                            <Route path="/addresses" element={<AddressesPage />} />

                            <Route path="/become-seller" element={<BecomeSellerPage />} />
                            <Route path="/seller/apply" element={<BecomeSellerPage />} />
                            <Route path="/seller/status" element={<SellerStatusPage />} />
                        </Route>
                    </Route>

                    {/* Seller only: phải có seller_profile approved */}
                    <Route element={<SellerProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            <Route path="/seller/shop/setup" element={<ShopSetupPage />} />
                            <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
                            <Route path="/seller/products/new" element={<CreateProductPage />} />
                        </Route>
                    </Route>

                    {/* Admin / Manager */}
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                            <Route path="/admin" element={<AdminLayout />}>
                                <Route index element={<Navigate to="/admin/sellers" replace />} />

                                <Route path="sellers" element={<AdminSellersPage />} />
                                <Route path="sellers/:sellerId" element={<AdminSellerDetailPage />} />

                                <Route path="products" element={<AdminProductsPage />} />
                                <Route path="products/:productId" element={<AdminProductDetailPage />} />
                            </Route>
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
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