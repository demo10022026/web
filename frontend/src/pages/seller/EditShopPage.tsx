import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    CreditCard,
    Eye,
    ImagePlus,
    Loader2,
    Save,
    Store,
} from 'lucide-react'
import {
    sellerShopProfileApi,
    type SellerShopStatus,
} from '@/api/sellerShopProfileApi'
import { bankApi } from '@/api/bankApi'

interface ShopFormState {
    shopName: string
    description: string
    shopStatus: Exclude<SellerShopStatus, 'suspended'>
    avatar: File | null
    banner: File | null
}

interface BankFormState {
    bankName: string
    accountHolder: string
    accountNumber: string
}

const EMPTY_SHOP_FORM: ShopFormState = {
    shopName: '',
    description: '',
    shopStatus: 'active',
    avatar: null,
    banner: null,
}

const EMPTY_BANK_FORM: BankFormState = {
    bankName: '',
    accountHolder: '',
    accountNumber: '',
}

export default function EditShopPage() {
    const queryClient = useQueryClient()

    const [shopForm, setShopForm] = useState<ShopFormState>(EMPTY_SHOP_FORM)
    const [bankForm, setBankForm] = useState<BankFormState>(EMPTY_BANK_FORM)

    const {
        data: profile,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['sellerShopProfile'],
        queryFn: sellerShopProfileApi.getMyShopProfile,
        retry: false,
        staleTime: 0,
    })

    const {
        data: banks = [],
        isLoading: isLoadingBanks,
        isError: isBanksError,
    } = useQuery({
        queryKey: ['vietQrBanks'],
        queryFn: bankApi.getBanks,
        staleTime: 24 * 60 * 60 * 1000,
        retry: 1,
    })

    useEffect(() => {
        if (!profile) return

        setShopForm({
            shopName: profile.shopName ?? '',
            description: profile.description ?? '',
            shopStatus:
                profile.shopStatus === 'hidden' ? 'hidden' : 'active',
            avatar: null,
            banner: null,
        })

        setBankForm({
            bankName: profile.bankAccount?.bankName ?? '',
            accountHolder: profile.bankAccount?.accountHolder ?? '',
            accountNumber: profile.bankAccount?.accountNumber ?? '',
        })
    }, [profile])

    const avatarPreview = useMemo(() => {
        if (shopForm.avatar) return URL.createObjectURL(shopForm.avatar)
        return profile?.avatarUrl ?? ''
    }, [shopForm.avatar, profile?.avatarUrl])

    const bannerPreview = useMemo(() => {
        if (shopForm.banner) return URL.createObjectURL(shopForm.banner)
        return profile?.bannerUrl ?? ''
    }, [shopForm.banner, profile?.bannerUrl])

    const updateShopMutation = useMutation({
        mutationFn: sellerShopProfileApi.updateMyShopProfile,
        onSuccess: () => {
            toast.success('Đã cập nhật thông tin shop')
            queryClient.invalidateQueries({ queryKey: ['sellerShopProfile'] })
            queryClient.invalidateQueries({ queryKey: ['sellerDashboard'] })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể cập nhật shop'
            )
        },
    })

    const updateBankMutation = useMutation({
        mutationFn: sellerShopProfileApi.upsertBankAccount,
        onSuccess: () => {
            toast.success('Đã cập nhật thông tin thanh toán')
            queryClient.invalidateQueries({ queryKey: ['sellerShopProfile'] })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể cập nhật thông tin thanh toán'
            )
        },
    })

    const handleSubmitShop = (e: FormEvent) => {
        e.preventDefault()

        if (!shopForm.shopName.trim()) {
            toast.error('Nhập tên shop')
            return
        }

        updateShopMutation.mutate({
            shopName: shopForm.shopName.trim(),
            description: shopForm.description.trim() || undefined,
            shopStatus: shopForm.shopStatus,
            avatar: shopForm.avatar,
            banner: shopForm.banner,
        })
    }

    const handleSubmitBank = (e: FormEvent) => {
        e.preventDefault()

        if (!bankForm.bankName.trim()) {
            toast.error('Nhập tên ngân hàng')
            return
        }

        if (!bankForm.accountHolder.trim()) {
            toast.error('Nhập tên chủ tài khoản')
            return
        }

        if (!bankForm.accountNumber.trim()) {
            toast.error('Nhập số tài khoản')
            return
        }

        updateBankMutation.mutate({
            bankName: bankForm.bankName.trim(),
            accountHolder: bankForm.accountHolder.trim(),
            accountNumber: bankForm.accountNumber.trim(),
        })
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải thông tin shop...
            </div>
        )
    }

    if (isError || !profile) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                    Không thể tải thông tin shop.
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Chỉnh sửa shop
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Cập nhật thông tin hiển thị công khai và thông tin thanh toán.
                    </p>
                </div>

                <Link
                    to={`/shops/${profile.shopSlug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    <Eye size={16} />
                    Xem shop công khai
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                    <form
                        onSubmit={handleSubmitShop}
                        className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                    >
                        <div className="border-b border-gray-100 p-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Store size={19} />
                                Thông tin shop
                            </h2>
                        </div>

                        <div className="space-y-5 p-5">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Tên shop
                                </label>
                                <input
                                    value={shopForm.shopName}
                                    onChange={(e) =>
                                        setShopForm((prev) => ({
                                            ...prev,
                                            shopName: e.target.value,
                                        }))
                                    }
                                    maxLength={150}
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Mô tả shop
                                </label>
                                <textarea
                                    value={shopForm.description}
                                    onChange={(e) =>
                                        setShopForm((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows={5}
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                    placeholder="Giới thiệu ngắn về shop, sản phẩm chủ lực, chính sách phục vụ..."
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Trạng thái hiển thị
                                </label>
                                <select
                                    value={shopForm.shopStatus}
                                    onChange={(e) =>
                                        setShopForm((prev) => ({
                                            ...prev,
                                            shopStatus: e.target.value as Exclude<SellerShopStatus, 'suspended'>,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                >
                                    <option value="active">Đang hoạt động</option>
                                    <option value="hidden">Tạm ẩn shop</option>
                                </select>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Avatar shop
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border bg-gray-50">
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Store className="h-9 w-9 text-gray-300" />
                                            )}
                                        </div>

                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <ImagePlus size={16} />
                                            Chọn ảnh
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                    setShopForm((prev) => ({
                                                        ...prev,
                                                        avatar: e.target.files?.[0] ?? null,
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Banner shop
                                    </label>
                                    <div className="overflow-hidden rounded-2xl border bg-gray-50">
                                        <div className="flex h-28 items-center justify-center">
                                            {bannerPreview ? (
                                                <img
                                                    src={bannerPreview}
                                                    alt="banner"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <ImagePlus className="h-9 w-9 text-gray-300" />
                                            )}
                                        </div>
                                        <label className="block cursor-pointer border-t px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-50">
                                            Chọn banner
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                    setShopForm((prev) => ({
                                                        ...prev,
                                                        banner: e.target.files?.[0] ?? null,
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-gray-100 p-5">
                            <button
                                type="submit"
                                disabled={updateShopMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                            >
                                {updateShopMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                Lưu thông tin shop
                            </button>
                        </div>
                    </form>

                    <form
                        onSubmit={handleSubmitBank}
                        className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                    >
                        <div className="border-b border-gray-100 p-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <CreditCard size={19} />
                                Thông tin thanh toán
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Dùng để nhận tiền thanh toán và đối soát doanh thu.
                            </p>
                        </div>

                        <div className="grid gap-4 p-5 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Ngân hàng
                                </label>
                                <select
                                    value={bankForm.bankName}
                                    onChange={(e) =>
                                        setBankForm((prev) => ({
                                            ...prev,
                                            bankName: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                >
                                    <option value="">
                                        {isLoadingBanks
                                            ? 'Đang tải danh sách ngân hàng...'
                                            : 'Chọn ngân hàng'}
                                    </option>

                                    {bankForm.bankName &&
                                        !banks.some(
                                            (bank) =>
                                                bank.name === bankForm.bankName ||
                                                bank.shortName === bankForm.bankName
                                        ) && (
                                            <option value={bankForm.bankName}>
                                                {bankForm.bankName}
                                            </option>
                                        )}

                                    {banks.map((bank) => (
                                        <option key={bank.id || bank.bin || bank.code} value={bank.name}>
                                            {bank.shortName} — {bank.name}
                                        </option>
                                    ))}
                                </select>

                                {isBanksError && (
                                    <p className="mt-1 text-xs text-red-500">
                                        Không thể tải danh sách ngân hàng. Có thể nhập lại sau hoặc kiểm tra kết nối mạng.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Chủ tài khoản
                                </label>
                                <input
                                    value={bankForm.accountHolder}
                                    onChange={(e) =>
                                        setBankForm((prev) => ({
                                            ...prev,
                                            accountHolder: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                    placeholder="VD: NGUYEN VAN A"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Số tài khoản
                                </label>
                                <input
                                    value={bankForm.accountNumber}
                                    onChange={(e) =>
                                        setBankForm((prev) => ({
                                            ...prev,
                                            accountNumber: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-orange-500"
                                    placeholder="VD: 0123456789"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-gray-100 p-5">
                            <button
                                type="submit"
                                disabled={updateBankMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                            >
                                {updateBankMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                Lưu thông tin thanh toán
                            </button>
                        </div>
                    </form>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-gray-900">
                            Xem trước
                        </h2>

                        <div className="mt-4 overflow-hidden rounded-2xl border bg-gray-50">
                            <div className="h-28 bg-gradient-to-r from-orange-400 to-orange-600">
                                {bannerPreview && (
                                    <img
                                        src={bannerPreview}
                                        alt="banner preview"
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </div>

                            <div className="px-4 pb-4">
                                <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-orange-50 shadow">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="avatar preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Store className="h-8 w-8 text-orange-400" />
                                    )}
                                </div>

                                <h3 className="mt-3 font-semibold text-gray-900">
                                    {shopForm.shopName || 'Tên shop'}
                                </h3>

                                <p className="mt-1 text-xs text-gray-400">
                                    @{profile.shopSlug}
                                </p>

                                <p className="mt-3 text-sm leading-6 text-gray-600">
                                    {shopForm.description || 'Mô tả shop sẽ hiển thị tại đây.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-gray-900">
                            Thanh toán hiện tại
                        </h2>

                        {profile.bankAccount ? (
                            <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <p>
                                    <span className="text-gray-400">Ngân hàng:</span>{' '}
                                    {profile.bankAccount.bankName}
                                </p>
                                <p>
                                    <span className="text-gray-400">Chủ TK:</span>{' '}
                                    {profile.bankAccount.accountHolder}
                                </p>
                                <p>
                                    <span className="text-gray-400">Số TK:</span>{' '}
                                    {profile.bankAccount.maskedAccountNumber || profile.bankAccount.accountNumber}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-gray-400">
                                Shop chưa có thông tin thanh toán.
                            </p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    )
}
