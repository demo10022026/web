import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, Store, ShoppingBag,
    Package, Star, BarChart2, Settings,
    ChevronDown, ChevronRight, ShoppingCart,
    X, CreditCard,
} from 'lucide-react'

interface NavItem {
    label: string
    icon: React.ElementType
    to?: string
    children?: { label: string; to: string }[]
}

const NAV: NavItem[] = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        to: '/admin',
    },
    {
        label: 'Quản lý Seller',
        icon: Store,
        children: [
            { label: 'Danh sách Seller',  to: '/admin/sellers' },
            { label: 'Chờ xét duyệt',    to: '/admin/sellers?status=pending' },
            { label: 'Duyệt tài liệu',   to: '/admin/sellers/documents' },
        ],
    },
    {
        label: 'Người dùng',
        icon: Users,
        children: [
            { label: 'Tất cả người dùng', to: '/admin/users' },
            { label: 'Phân quyền',        to: '/admin/users/roles' },
        ],
    },
    {
        label: 'Sản phẩm',
        icon: Package,
        children: [
            { label: 'Tất cả sản phẩm', to: '/admin/products' },
            { label: 'Danh mục',        to: '/admin/categories' },
            { label: 'Thương hiệu',     to: '/admin/brands' },
        ],
    },
    {
        label: 'Đơn hàng',
        icon: ShoppingCart,
        children: [
            { label: 'Tất cả đơn hàng', to: '/admin/orders' },
            { label: 'Hoàn tiền',       to: '/admin/orders/refunds' },
        ],
    },
    {
        label: 'Thanh toán',
        icon: CreditCard,
        children: [
            { label: 'Giao dịch',      to: '/admin/payments' },
            { label: 'Yêu cầu rút',    to: '/admin/payouts' },
        ],
    },
    {
        label: 'Đánh giá',
        icon: Star,
        to: '/admin/reviews',
    },
    {
        label: 'Báo cáo',
        icon: BarChart2,
        to: '/admin/reports',
    },
    {
        label: 'Cài đặt',
        icon: Settings,
        to: '/admin/settings',
    },
]

interface Props {
    open: boolean
    onClose: () => void
}

export default function AdminSidebar({ open, onClose }: Props) {
    const location = useLocation()
    const [expanded, setExpanded] = useState<string[]>(['Quản lý Seller'])

    const toggle = (label: string) =>
        setExpanded(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        )

    const isActive = (to: string) =>
        location.pathname === to ||
        (to !== '/admin' && location.pathname.startsWith(to))

    return (
        <>
            {/* Overlay mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white
                    flex flex-col z-40 transition-transform duration-300
                    ${open ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 lg:static lg:h-screen`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <Link to="/admin" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <span className="text-base font-bold text-white">ShopVN</span>
                            <span className="block text-[10px] text-gray-400 -mt-0.5">Admin Panel</span>
                        </div>
                    </Link>
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5
                        scrollbar-thin scrollbar-thumb-white/10">
                    {NAV.map(item => {
                        const Icon = item.icon
                        const isExpanded = expanded.includes(item.label)

                        if (item.to) {
                            const active = isActive(item.to)
                            return (
                                <Link
                                    key={item.label}
                                    to={item.to}
                                    onClick={() => onClose()}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                              font-medium transition-all duration-150
                              ${active
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
                                    {item.label}
                                </Link>
                            )
                        }

                        // Group with children
                        const hasActiveChild = item.children?.some(c => isActive(c.to))

                        return (
                            <div key={item.label}>
                                <button
                                    onClick={() => toggle(item.label)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                              font-medium transition-all duration-150
                              ${hasActiveChild
                                        ? 'text-white bg-white/5'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <Icon className="shrink-0" size={18} />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {isExpanded
                                        ? <ChevronDown size={14} />
                                        : <ChevronRight size={14} />}
                                </button>

                                {isExpanded && (
                                    <div className="ml-9 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                        {item.children!.map(child => {
                                            const active = isActive(child.to)
                                            return (
                                                <Link
                                                    key={child.to}
                                                    to={child.to}
                                                    onClick={() => onClose()}
                                                    className={`block px-3 py-2 rounded-lg text-xs transition-all
                                      ${active
                                                        ? 'text-violet-400 font-semibold'
                                                        : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {child.label}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Bottom user */}
                <div className="px-4 py-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <Users size={16} className="text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">Admin</p>
                            <p className="text-[10px] text-gray-500">admin@shopvn.com</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}