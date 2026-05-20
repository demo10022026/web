import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    Ban,
    CheckCircle2,
    Eye,
    Loader2,
    Search,
    ShieldCheck,
    Store,
    UserCog,
    Users,
} from 'lucide-react'
import {
    adminUserApi,
    type AdminAccountStatus,
    type AdminUser,
    type AdminUserRole,
} from '@/api/admin/adminUserApi'
import { useAuthStore } from '@/store/authStore'

const ROLE_OPTIONS: Array<{
    label: string
    value: 'all' | AdminUserRole
}> = [
    { label: 'Tất cả vai trò', value: 'all' },
    { label: 'User', value: 'user' },
    { label: 'Seller', value: 'seller' },
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
]

const STATUS_OPTIONS: Array<{
    label: string
    value: 'all' | AdminAccountStatus
}> = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Đang hoạt động', value: 'active' },
    { label: 'Tạm khóa', value: 'suspended' },
    { label: 'Bị cấm', value: 'banned' },
]

function roleLabel(role?: string | null) {
    switch (role) {
        case 'user':
            return 'User'
        case 'seller':
            return 'Seller'
        case 'admin':
            return 'Admin'
        case 'manager':
            return 'Manager'
        default:
            return 'Không rõ'
    }
}

function roleClass(role?: string | null) {
    switch (role) {
        case 'admin':
            return 'bg-red-50 text-red-700'
        case 'manager':
            return 'bg-purple-50 text-purple-700'
        case 'seller':
            return 'bg-orange-50 text-orange-700'
        case 'user':
            return 'bg-blue-50 text-blue-700'
        default:
            return 'bg-gray-100 text-gray-600'
    }
}

function statusLabel(status?: string | null) {
    switch (status) {
        case 'active':
            return 'Hoạt động'
        case 'suspended':
            return 'Tạm khóa'
        case 'banned':
            return 'Bị cấm'
        default:
            return 'Không rõ'
    }
}

function statusClass(status?: string | null) {
    switch (status) {
        case 'active':
            return 'bg-green-50 text-green-700'
        case 'suspended':
            return 'bg-yellow-50 text-yellow-700'
        case 'banned':
            return 'bg-red-50 text-red-700'
        default:
            return 'bg-gray-100 text-gray-600'
    }
}

function formatDate(value?: string | null) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

function UserRow({
    user,
    actorId,
    actorRole,
    onStatusChange,
    updating,
}: {
    user: AdminUser
    actorId?: number
    actorRole?: string
    onStatusChange: (user: AdminUser, status: AdminAccountStatus) => void
    updating: boolean
}) {
    const isSelf = actorId === user.userId
    const managerBlocked = actorRole === 'manager' && user.role === 'admin'
    const disableStatusAction = updating || managerBlocked || isSelf

    return (
        <tr className="border-b border-gray-50 hover:bg-gray-50">
            <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                            <Users className="h-5 w-5 text-gray-400" />
                        </div>
                    )}

                    <div>
                        <p className="font-medium text-gray-900">
                            {user.fullName}
                        </p>

                        <p className="text-xs text-gray-400">
                            @{user.username}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-4 py-4">
                <p className="text-sm text-gray-800">{user.email}</p>
                <p className="text-xs text-gray-400">{user.phoneNumber}</p>
            </td>

            <td className="px-4 py-4">
                <span
                    className={[
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        roleClass(user.role),
                    ].join(' ')}
                >
                    {roleLabel(user.role)}
                </span>
            </td>

            <td className="px-4 py-4">
                <span
                    className={[
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        statusClass(user.accountStatus),
                    ].join(' ')}
                >
                    {statusLabel(user.accountStatus)}
                </span>
            </td>

            <td className="px-4 py-4">
                {user.hasSellerProfile ? (
                    <div className="text-sm">
                        <p className="font-medium text-gray-800">
                            {user.shopName || 'Có hồ sơ seller'}
                        </p>

                        <p className="text-xs text-gray-400">
                            {user.sellerStatus || '-'}
                        </p>
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">Không</span>
                )}
            </td>

            <td className="px-4 py-4 text-sm text-gray-500">
                {formatDate(user.createdAt)}
            </td>

            <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                    <Link
                        to={`/admin/users/${user.userId}`}
                        className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Eye size={15} />
                        Chi tiết
                    </Link>

                    {user.accountStatus === 'active' ? (
                        <button
                            type="button"
                            disabled={disableStatusAction}
                            onClick={() => onStatusChange(user, 'suspended')}
                            title={
                                isSelf
                                    ? 'Không thể tự khóa chính mình'
                                    : managerBlocked
                                      ? 'Manager không thể khóa admin'
                                      : undefined
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-yellow-100 px-3 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50 disabled:opacity-60"
                        >
                            <Ban size={15} />
                            Tạm khóa
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={disableStatusAction}
                            onClick={() => onStatusChange(user, 'active')}
                            className="inline-flex items-center gap-1 rounded-xl border border-green-100 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-60"
                        >
                            <CheckCircle2 size={15} />
                            Mở khóa
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
}

export default function AdminUsersPage() {
    const queryClient = useQueryClient()
    const actor = useAuthStore((state) => state.user)

    const [keywordInput, setKeywordInput] = useState('')
    const [keyword, setKeyword] = useState('')
    const [role, setRole] = useState<'all' | AdminUserRole>('all')
    const [status, setStatus] = useState<'all' | AdminAccountStatus>('all')
    const [page, setPage] = useState(0)

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['adminUsers', keyword, role, status, page],
        queryFn: () =>
            adminUserApi.getUsers({
                keyword: keyword || undefined,
                role,
                status,
                page,
                size: 10,
            }),
        staleTime: 0,
    })

    const statsQuery = useQuery({
        queryKey: ['adminUserStats'],
        queryFn: adminUserApi.getStats,
        staleTime: 0,
    })

    const updateMutation = useMutation({
        mutationFn: ({
            user,
            accountStatus,
        }: {
            user: AdminUser
            accountStatus: AdminAccountStatus
        }) =>
            adminUserApi.updateUserStatus(user.userId, {
                accountStatus,
            }),
        onSuccess: () => {
            toast.success('Cập nhật trạng thái tài khoản thành công')
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
            queryClient.invalidateQueries({ queryKey: ['adminUserStats'] })
            queryClient.invalidateQueries({ queryKey: ['adminDashboard'] })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật tài khoản'
            )
        },
    })

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        setKeyword(keywordInput.trim())
        setPage(0)
    }

    const handleStatusChange = (
        user: AdminUser,
        accountStatus: AdminAccountStatus
    ) => {
        const ok = window.confirm(
            `Đổi trạng thái tài khoản "${user.email}" sang "${statusLabel(accountStatus)}"?`
        )

        if (!ok) return

        updateMutation.mutate({
            user,
            accountStatus,
        })
    }

    const users = data?.content ?? []
    const stats = statsQuery.data

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Quản lý người dùng
                </h1>
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Tổng tài khoản</p>
                        <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {stats?.totalUsers ?? 0}
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Đang hoạt động</p>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {stats?.activeUsers ?? 0}
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Seller</p>
                        <Store className="h-5 w-5 text-orange-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {stats?.sellerUsers ?? 0}
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Admin/Manager</p>
                        <ShieldCheck className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {(stats?.adminUsers ?? 0) + (stats?.managerUsers ?? 0)}
                    </p>
                </div>
            </div>

            <div className="mb-5 rounded-2xl border bg-white p-4 shadow-sm">
                <form
                    onSubmit={handleSearch}
                    className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]"
                >
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Tìm tên, username, email, SĐT..."
                            className="flex-1 text-sm outline-none"
                        />
                    </div>

                    <select
                        value={role}
                        onChange={(e) => {
                            setRole(e.target.value as 'all' | AdminUserRole)
                            setPage(0)
                        }}
                        className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                    >
                        {ROLE_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value as 'all' | AdminAccountStatus)
                            setPage(0)
                        }}
                        className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                    >
                        {STATUS_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        Tìm kiếm
                    </button>
                </form>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                {isLoading ? (
                    <div className="flex min-h-[320px] items-center justify-center text-gray-500">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang tải người dùng...
                    </div>
                ) : isError ? (
                    <div className="m-4 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
                        Không thể tải danh sách người dùng.
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                        <UserCog className="mx-auto h-12 w-12 text-gray-300" />

                        <h2 className="mt-4 font-semibold text-gray-800">
                            Không có người dùng phù hợp
                        </h2>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                                        Người dùng
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                                        Liên hệ
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                                        Vai trò
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                                        Seller/Shop
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                                        Ngày tạo
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((user) => (
                                    <UserRow
                                        key={user.userId}
                                        user={user}
                                        actorId={actor?.userId}
                                        actorRole={actor?.role}
                                        onStatusChange={handleStatusChange}
                                        updating={updateMutation.isPending}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {data && data.totalPages > 1 && (
                <div className="mt-5 flex justify-center gap-2">
                    {Array.from({ length: data.totalPages }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setPage(i)}
                            className={[
                                'h-9 w-9 rounded-xl text-sm font-medium',
                                page === i
                                    ? 'bg-orange-500 text-white'
                                    : 'border bg-white text-gray-600 hover:border-orange-300',
                            ].join(' ')}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
