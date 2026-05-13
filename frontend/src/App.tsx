import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import HomePage from '@/pages/HomePage'
import ProfilePage from '@/pages/ProfilePage'
import SearchPage from '@/pages/SearchPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import { FlashSalePage } from '@/pages/FlashSalePage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
})

const CartPage    = () => <div className="p-8 text-center text-gray-400">Giỏ hàng — Sprint 3</div>
const AdminPage   = () => <div className="p-8 text-center text-gray-400">Quản lý — Sprint 5</div>

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth (không có header) */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Public với Header */}
          <Route element={<MainLayout />}>
            <Route path="/"              element={<HomePage />} />
            <Route path="/search"        element={<SearchPage />} />
            <Route path="/products/:id"  element={<ProductDetailPage />} />
            <Route path="/flash-sale"    element={<FlashSalePage />} />
            <Route path="/new-products"  element={<SearchPage />} />
          </Route>

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/cart"    element={<CartPage />} />
              <Route path="/orders"  element={<div className="p-8">Đơn hàng — Sprint 3</div>} />
            </Route>
          </Route>

          {/* Admin/Manager */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
            <Route element={<MainLayout />}>
              <Route path="/admin/*" element={<AdminPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-right"
        toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
    </QueryClientProvider>
  )
}
