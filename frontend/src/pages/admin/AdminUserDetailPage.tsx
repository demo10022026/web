import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    CheckCircle2,
    Copy,
    KeyRound,
    Loader2,
    Mail,
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
import { useAuthStore } from '@/store/authStore'

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

function Info({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="rounded-xl border bg-gray-50 p-3">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="mt-1 break-words text-sm font-medium text-gray-800">
                {value || '-'}
            </p>
        </div>
    )
}

export default function AdminUserDetailPage() {
    const { userId } = useParams()
    const id = Number(userId)
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const actor = useAuthStore((state) => state.user)

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [role, setRole] = useState<AdminUserRole>('user')
    const [accountStatus, setAccountStatus] =
        useState<AdminAccountStatus>('active')
    const [customPassword, setCustomPassword] = useState('')
    const [temporaryPassword, setTemporaryPassword] = useState('')

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

        setFullName(user.fullName ?? '')
        setEmail(user.email ?? '')
        setPhoneNumber(user.phoneNumber ?? '')
        setRole(user.role)
        setAccountStatus(user.accountStatus)
        setTemporaryPassword('')
    }, [user])

    const invalidateUserQueries = (updated?: unknown) => {
        if (updated) {
            queryClient.setQueryData(['adminUserDetail', id], updated)
        }

        queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
        queryClient.invalidateQueries({ queryKey: ['adminUserStats'] })
        queryClient.invalidateQueries({ queryKey: ['adminDashboard'] })
    }

    const profileMutation = useMutation({
        mutationFn: () =>
            adminUserApi.updateUserProfile(id, {
                fullName: fullName.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
            }),
        onSuccess: (updated) => {
            toast.success('Đã cập nhật thông tin tài khoản')
            invalidateUserQueries(updated)
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật thông tin tài khoản'
            )
        },
    })

    const statusMutation = useMutation({
        mutationFn: () =>
            adminUserApi.updateUserStatus(id, {
                accountStatus,
            }),
        onSuccess: (updated) => {
            toast.success('Đã cập nhật trạng thái tài khoản')
            invalidateUserQueries(updated)
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật trạng thái tài khoản'
            )
        },
    })

    const roleMutation = useMutation({
        mutationFn: () =>
            adminUserApi.updateUserRole(id, {
                role,
            }),
        onSuccess: (updated) => {
            toast.success('Đã cập nhật vai trò người dùng')
            invalidateUserQueries(updated)
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật vai trò người dùng'
            )
        },
    })

    const resetPasswordMutation = useMutation({
        mutationFn: () =>
            adminUserApi.resetUserPassword(id, {
                temporaryPassword: customPassword.trim() || undefined,
            }),
        onSuccess: (res) => {
            setTemporaryPassword(res.temporaryPassword)
            setCustomPassword('')
            toast.success('Đã reset mật khẩu')
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể reset mật khẩu'
            )
        },
    })

    const copyTemporaryPassword = async () => {
        if (!temporaryPassword) return

        try {
            await navigator.clipboard.writeText(temporaryPassword)
            toast.success('Đã sao chép mật khẩu tạm')
        } catch {
            toast.error('Không thể sao chép mật khẩu')
        }
    }

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

    const actorIsAdmin = actor?.role === 'admin'
    const actorIsManager = actor?.role === 'manager'
    const targetIsAdmin = user.role === 'admin'
    const isSelf = actor?.userId === user.userId
    const managerBlocked = actorIsManager && targetIsAdmin

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
                            <Info label="Giới tính" value={user.gender || '-'} />
                            <Info label="Ngày sinh" value={user.birthDate || '-'} />
                            <Info label="Ngày tạo" value={formatDate(user.createdAt)} />
                            <Info label="Cập nhật gần nhất" value={formatDate(user.updatedAt)} />
                            <Info label="Đăng nhập gần nhất" value={formatDate(user.lastLoginAt)} />
                            <Info
                                label="Xác minh"
                                value={`Email: ${user.emailVerified ? 'đã xác minh' : 'chưa'} · SĐT: ${user.phoneVerified ? 'đã xác minh' : 'chưa'}`}
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                            <Mail size={18} />
                            Sửa thông tin liên hệ
                        </h2>

                        {managerBlocked && (
                            <div className="mb-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
                                Manager không thể sửa tài khoản admin.
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Họ tên
                                </label>
                                <input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={managerBlocked}
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={managerBlocked}
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Số điện thoại
                                </label>
                                <input
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    disabled={managerBlocked}
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={profileMutation.isPending || managerBlocked}
                            onClick={() => profileMutation.mutate()}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                            {profileMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Lưu thông tin
                        </button>
                    </section>

                    {user.hasSellerProfile && (
                        <section className="rounded-2xl border bg-white p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                                <Store size={18} />
                                Hồ sơ seller / shop
                            </h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Info label="Seller ID" value={user.sellerId ? String(user.sellerId) : '-'} />
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
                                        Xem chi tiết seller
                                    </Link>
                                )}

                                {(user.shopSlug || user.shopId) && (
                                    <Link
                                        to={`/shops/${user.shopSlug || user.shopId}`}
                                        className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                            Vai trò và trạng thái
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Trạng thái tài khoản
                                </label>
                                <select
                                    value={accountStatus}
                                    onChange={(e) =>
                                        setAccountStatus(e.target.value as AdminAccountStatus)
                                    }
                                    disabled={managerBlocked}
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                >
                                    <option value="active">Hoạt động</option>
                                    <option value="suspended">Tạm khóa</option>
                                    <option value="banned">Bị cấm</option>
                                </select>
                            </div>

                            {isSelf && accountStatus !== 'active' && (
                                <p className="rounded-xl bg-yellow-50 p-3 text-xs text-yellow-700">
                                    Không thể tự khóa tài khoản đang đăng nhập.
                                </p>
                            )}

                            <button
                                type="button"
                                disabled={statusMutation.isPending || managerBlocked}
                                onClick={() => statusMutation.mutate()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                            >
                                {statusMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                Lưu trạng thái
                            </button>

                            <div className="border-t pt-4">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Vai trò
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as AdminUserRole)}
                                    disabled={!actorIsAdmin}
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                >
                                    <option value="user">User</option>

                                    {user.role !== 'seller' && !user.hasSellerProfile && (
                                        <option value="manager">Manager</option>
                                    )}

                                    {user.role === 'seller' && (
                                        <option value="seller">Seller</option>
                                    )}

                                    {user.role === 'admin' && (
                                        <option value="admin">Admin</option>
                                    )}
                                </select>

                                <p className="mt-2 text-xs text-gray-500">
                                    Chỉ admin được đổi vai trò.
                                </p>

                                <button
                                    type="button"
                                    disabled={roleMutation.isPending || !actorIsAdmin}
                                    onClick={() => roleMutation.mutate()}
                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    {roleMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Shield size={16} />
                                    )}
                                    Lưu vai trò
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                            <KeyRound size={18} />
                            Hỗ trợ mật khẩu
                        </h2>

                        <p className="text-sm text-gray-500">
                            Không thể xem lại mật khẩu cũ. Chỉ có thể reset sang mật khẩu tạm mới.
                        </p>

                        {managerBlocked && (
                            <div className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
                                Manager không thể reset mật khẩu tài khoản admin.
                            </div>
                        )}

                        <div className="mt-4">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Mật khẩu tạm tùy chọn
                            </label>
                            <input
                                value={customPassword}
                                onChange={(e) => setCustomPassword(e.target.value)}
                                disabled={managerBlocked}
                                placeholder="Để trống để hệ thống tự sinh"
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={resetPasswordMutation.isPending || managerBlocked}
                            onClick={() => resetPasswordMutation.mutate()}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                        >
                            {resetPasswordMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <KeyRound size={16} />
                            )}
                            Reset mật khẩu
                        </button>

                        {temporaryPassword && (
                            <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3">
                                <p className="text-xs text-green-700">
                                    Mật khẩu tạm mới
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <code className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                                        {temporaryPassword}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={copyTemporaryPassword}
                                        className="rounded-lg border bg-white p-2 text-gray-500 hover:text-orange-600"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-green-700">
                                    Chỉ hiển thị một lần. Hãy copy và gửi cho người dùng.
                                </p>
                            </div>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    )
}
