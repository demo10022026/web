import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Save,
    Shield,
    Store,
    User,
} from 'lucide-react'
import {
    adminUserApi,
    type AdminAccountStatus,
    type AdminUserRole,
} from '@/api/admin/adminUserApi'

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

export default function AdminUserDetailPage() {
    const { userId } = useParams()
    const id = Number(userId)
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [role, setRole] = useState<AdminUserRole>('user')
    const [accountStatus, setAccountStatus] =
        useState<AdminAccountStatus>('active')

    const {
        data: user,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['adminUserDetail', id],
        queryFn: () => adminUserApi.getUserDetail(id),
        enabled: Number.isFinite(id),
        retry: false,
    })

    useEffect(() => {
        if (!user) return

        setRole(user.role)
        setAccountStatus(user.accountStatus)
    }, [user])

    const updateMutation = useMutation({
        mutationFn: () =>
            adminUserApi.updateUser(id, {
                role,
                accountStatus,
            }),
        onSuccess: (updated) => {
            toast.success('Cập nhật tài khoản thành công')

            queryClient.setQueryData(['adminUserDetail', id], updated)
            queryClient.invalidateQueries({
                queryKey: ['adminUsers'],
            })
            queryClient.invalidateQueries({
                queryKey: ['adminUserStats'],
            })
            queryClient.invalidateQueries({
                queryKey: ['adminDashboard'],
            })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật tài khoản'
            )
        },
    })

    if (isLoading) {
        return (
            <div className="flex min-h-[480px] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải tài khoản...
            </div>
        )
    }

    if (isError || !user) {
        return (
            <div className="p-6">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải thông tin tài khoản.
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="mb-5 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
            >
                <ArrowLeft size={16} />
                Quay lại danh sách người dùng
            </button>

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="h-20 w-20 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                            <User className="h-9 w-9 text-gray-400" />
                        </div>
                    )}

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {user.fullName}
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            @{user.username} · {user.email}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                                {roleLabel(user.role)}
                            </span>

                            <span className="rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
                                {statusLabel(user.accountStatus)}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                    {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    Lưu thay đổi
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                            <User size={18} />
                            Thông tin tài khoản
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Info label="User ID" value={String(user.userId)} />
                            <Info label="Username" value={user.username} />
                            <Info label="Họ tên" value={user.fullName} />
                            <Info label="Email" value={user.email} />
                            <Info label="Số điện thoại" value={user.phoneNumber} />
                            <Info label="Giới tính" value={user.gender || '-'} />
                            <Info label="Ngày sinh" value={user.birthDate || '-'} />
                            <Info label="Ngày tạo" value={formatDate(user.createdAt)} />
                            <Info label="Đăng nhập gần nhất" value={formatDate(user.lastLoginAt)} />
                        </div>
                    </section>

                    {user.hasSellerProfile && (
                        <section className="rounded-2xl border bg-white p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                                <Store size={18} />
                                Hồ sơ seller
                            </h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Info
                                    label="Seller ID"
                                    value={user.sellerId ? String(user.sellerId) : '-'}
                                />
                                <Info label="Trạng thái seller" value={user.sellerStatus || '-'} />
                                <Info label="CCCD/CMND" value={user.identityNumber || '-'} />
                                <Info label="Mã số thuế" value={user.taxCode || '-'} />
                                <Info label="Shop" value={user.shopName || '-'} />
                                <Info label="Trạng thái shop" value={user.shopStatus || '-'} />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {user.sellerId && (
                                    <Link
                                        to={`/admin/sellers/${user.sellerId}`}
                                        className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Xem hồ sơ seller
                                    </Link>
                                )}

                                {(user.shopSlug || user.shopId) && (
                                    <Link
                                        to={`/shops/${user.shopSlug || user.shopId}`}
                                        className="rounded-xl border px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                                    >
                                        Xem shop public
                                    </Link>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="space-y-6">
                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                            <Shield size={18} />
                            Quyền và trạng thái
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Vai trò
                                </label>

                                <select
                                    value={role}
                                    onChange={(e) =>
                                        setRole(e.target.value as AdminUserRole)
                                    }
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                >
                                    <option value="user">User</option>
                                    <option value="seller">Seller</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Trạng thái tài khoản
                                </label>

                                <select
                                    value={accountStatus}
                                    onChange={(e) =>
                                        setAccountStatus(
                                            e.target.value as AdminAccountStatus
                                        )
                                    }
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                >
                                    <option value="active">Hoạt động</option>
                                    <option value="suspended">Tạm khóa</option>
                                    <option value="banned">Bị cấm</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-yellow-50 p-3 text-xs text-yellow-700">
                            Không thể tự khóa hoặc tự hạ quyền tài khoản admin/manager đang đăng nhập.
                        </div>
                    </section>

                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                            <CheckCircle2 size={18} />
                            Xác minh
                        </h2>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Email</span>
                                <span className={user.emailVerified ? 'text-green-600' : 'text-gray-400'}>
                                    {user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">SĐT</span>
                                <span className={user.phoneVerified ? 'text-green-600' : 'text-gray-400'}>
                                    {user.phoneVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                                </span>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}

function Info({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase text-gray-400">
                {label}
            </p>

            <p className="mt-1 break-words text-sm text-gray-800">
                {value}
            </p>
        </div>
    )
}
