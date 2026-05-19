import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Menu, Search, Bell, ChevronDown,
    User, Settings, LogOut, Home,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi }      from '@/api/authApi'
import toast            from 'react-hot-toast'

interface Props {
    onMenuClick: () => void
}

export default function AdminTopbar({ onMenuClick }: Props) {
    const { user, clearAuth, refreshToken } = useAuthStore()
    const [userOpen, setUserOpen] = useState(false)
    const navigate = useNavigate()

    const handleLogout = async () => {
        try { if (refreshToken) await authApi.logout(refreshToken) } finally {
            clearAuth()
            navigate('/login')
            toast.success('Đã đăng xuất')
        }
    }

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center
                        justify-between px-4 sm:px-6 sticky top-0 z-20">

            {/* Left */}
            <div className="flex items-center gap-4">
                {/* Hamburger */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <h1 className="hidden sm:block text-sm font-semibold text-gray-700">
                    Admin Panel
                </h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">

                {/* Search */}
                <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200
                        rounded-xl px-3 py-2 w-56">
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <input
                        placeholder="Tìm kiếm..."
                        className="bg-transparent text-sm outline-none text-gray-700
                       placeholder:text-gray-400 w-full"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200" />

                {/* User */}
                <div className="relative">
                    <button
                        onClick={() => setUserOpen(p => !p)}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl
                       hover:bg-gray-100 transition-colors"
                    >
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                <User size={14} className="text-violet-600" />
                            </div>
                        )}
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-gray-800 leading-tight">
                                {user?.fullName?.split(' ').slice(-2).join(' ') ?? 'Admin'}
                            </p>
                            <p className="text-xs text-gray-400 leading-tight capitalize">
                                {user?.role ?? 'admin'}
                            </p>
                        </div>
                        <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                    </button>

                    {userOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl
                            shadow-lg border border-gray-100 overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-800">{user?.fullName}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                            <div className="py-1">
                                <Link to="/admin/settings" onClick={() => setUserOpen(false)}
                                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                                    <Settings size={14} className="text-gray-400" /> Cài đặt
                                </Link>
                                <Link to="/" onClick={() => setUserOpen(false)}
                                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                                    <Home size={14} className="text-gray-400" /> Về trang chủ
                                </Link>
                                <button onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                             text-red-500 hover:bg-red-50">
                                    <LogOut size={14} /> Đăng xuất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}