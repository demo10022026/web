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
import ProductReviewsPage from '@/pages/ProductReviewsPage'
import NotificationsPage from '@/pages/NotificationsPage'
import MessagesPage from '@/pages/MessagesPage'

// User pages
import ProfilePage from '@/pages/ProfilePage'
import OrdersPage from '@/pages/OrdersPage'
import AddressesPage from '@/pages/AddressesPage'
import ShopPage from '@/pages/ShopPage'
import VouchersPage from '@/pages/VouchersPage'
import CheckoutPage from '@/pages/CheckoutPage'

// Seller pages
import BecomeSellerPage from '@/pages/seller/BecomeSellerPage'
import SellerStatusPage from '@/pages/seller/SellerStatusPage'
import SellerProtectedRoute from '@/components/ui/SellerProtectedRoute'
import ShopSetupPage from '@/pages/seller/ShopSetupPage'
import SellerDashboardPage from '@/pages/seller/SellerDashboardPage'
import CreateProductPage from '@/pages/seller/CreateProductPage'
import SellerProductsPage from '@/pages/seller/SellerProductsPage'
import EditProductPage from '@/pages/seller/EditProductPage'
import SellerOrdersPage from '@/pages/seller/SellerOrdersPage'
import SellerAnalyticsPage from '@/pages/seller/SellerAnalyticsPage'
import EditShopPage from '@/pages/seller/EditShopPage'
import SellerVouchersPage from '@/pages/seller/SellerVouchersPage'

// Cart pages
import CartPage from '@/pages/CartPage'

// Admin
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage.tsx";
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminProductDetailPage from '@/pages/admin/AdminProductDetailPage'
import AdminSellersPage from '@/pages/admin/AdminSellersPage'
import AdminSellerDetailPage from '@/pages/admin/AdminSellerDetailPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminUserDetailPage from '@/pages/admin/AdminUserDetailPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from '@/pages/admin/AdminOrderDetailPage'
import AdminVouchersPage from '@/pages/admin/AdminVouchersPage'
import AdminVoucherDetailPage from '@/pages/admin/AdminVoucherDetailPage'

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
                        <Route path="/products/:id/reviews" element={<ProductReviewsPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                    </Route>

                    {/* User authenticated */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={['user', 'seller', 'admin', 'manager']}
                            />
                        }
                    >
                        <Route element={<MainLayout />}>
                            <Route path="/profile" element={<ProfilePage />} />

                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/orders" element={<OrdersPage />} />
                            <Route path="/vouchers" element={<VouchersPage />} />
                            <Route path="/addresses" element={<AddressesPage />} />
                            <Route path="/user/addresses" element={<AddressesPage />} />
                            <Route path="/shops/:shopSlugOrId" element={<ShopPage />} />
                            <Route path="/shop/:shopSlugOrId" element={<ShopPage />} />

                            <Route path="/become-seller" element={<BecomeSellerPage />} />
                            <Route path="/seller/apply" element={<BecomeSellerPage />} />
                            <Route path="/seller/status" element={<SellerStatusPage />} />
                        </Route>
                    </Route>

                    {/* Seller only: phải có seller_profile approved */}
                    <Route element={<SellerProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            <Route path="/seller/shop/setup" element={<ShopSetupPage />} />
                            <Route path="/seller/shop/profile" element={<EditShopPage />} />
                            <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
                            <Route path="/seller/products" element={<SellerProductsPage />} />
                            <Route path="/seller/products/new" element={<CreateProductPage />} />
                            <Route path="/seller/products/:id/edit" element={<EditProductPage />} />
                            <Route path="/seller/orders" element={<SellerOrdersPage />} />
                            <Route path="/seller/analytics" element={<SellerAnalyticsPage />} />
                            <Route path="/seller/vouchers" element={<SellerVouchersPage />} />
                        </Route>
                    </Route>

                    {/* Admin / Manager */}
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                        <Route path="/admin" element={<AdminLayout />}>

                            <Route index element={<Navigate to="/admin/sellers" replace />} />

                            <Route path="dashboard" element={<AdminDashboardPage />} />

                            <Route path="vouchers" element={<AdminVouchersPage />} />
                            <Route path="vouchers/:voucherId" element={<AdminVoucherDetailPage />} />

                            <Route path="users" element={<AdminUsersPage />} />
                            <Route path="users/:userId" element={<AdminUserDetailPage />} />

                            <Route path="sellers" element={<AdminSellersPage />} />
                            <Route path="sellers/:sellerId" element={<AdminSellerDetailPage />} />

                            <Route path="products" element={<AdminProductsPage />} />
                            <Route path="products/:productId" element={<AdminProductDetailPage />} />

                            <Route path="orders" element={<AdminOrdersPage />} />
                            <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
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