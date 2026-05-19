import { Link, NavLink, Outlet } from 'react-router-dom'
import {
    LayoutDashboard,
    Package,
    Store,
    Users,
    ShoppingBag,
    BarChart3,
    Home,
} from 'lucide-react'

const navItems = [
    {
        to: '/admin/products',
        label: 'Sản phẩm',
        icon: Package,
    },
    {
        to: '/admin/sellers',
        label: 'Người bán',
        icon: Store,
        disabled: true,
    },
    {
        to: '/admin/users',
        label: 'Người dùng',
        icon: Users,
        disabled: true,
    },
    {
        to: '/admin/orders',
        label: 'Đơn hàng',
        icon: ShoppingBag,
        disabled: true,
    },
    {
        to: '/admin/reports',
        label: 'Báo cáo',
        icon: BarChart3,
        disabled: true,
    },
]

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-100">
            <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r border-gray-200 bg-white">
                <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900">Admin</h1>
                        <p className="text-xs text-gray-500">ShopVN Console</p>
                    </div>
                </div>

                <nav className="space-y-1 p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon

                        if (item.disabled) {
                            return (
                                <button
                                    key={item.to}
                                    disabled
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-400"
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                    <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">
                    sau
                  </span>
                                </button>
                            )
                        }

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    [
                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-orange-50 text-orange-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    ].join(' ')
                                }
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    })}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        <Home size={17} />
                        Về trang chủ
                    </Link>
                </div>
            </aside>

            <main className="ml-64 min-h-screen p-6">
                <Outlet />
            </main>
        </div>
    )
}