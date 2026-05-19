import { Navigate, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { sellerOnboardingApi } from '@/api/sellerOnboardingApi'

export default function SellerProtectedRoute() {
    const { isAuthenticated, user } = useAuthStore()

    const {
        data: profile,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['sellerMyProfile'],
        queryFn: sellerOnboardingApi.getMyProfile,
        retry: false,
        staleTime: 0,
        enabled: isAuthenticated,
    })

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Admin/manager không được đi vào khu seller shop dù có role cao hơn.
    if (user?.role === 'admin' || user?.role === 'manager') {
        return <Navigate to="/admin/products" replace />
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
            </div>
        )
    }

    if (isError || !profile) {
        return <Navigate to="/seller/apply" replace />
    }

    if (profile.verificationStatus !== 'approved') {
        return <Navigate to="/seller/status" replace />
    }

    return <Outlet />
}