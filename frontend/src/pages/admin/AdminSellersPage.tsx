import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import {
    adminSellerApi,
    type AdminSellerItem,
    type PageResponse,
} from '@/api/admin/adminSellerApi'

function statusBadge(status: string) {
    if (status === 'pending') {
        return 'bg-yellow-100 text-yellow-700'
    }

    if (status === 'approved') {
        return 'bg-green-100 text-green-700'
    }

    if (status === 'rejected') {
        return 'bg-red-100 text-red-700'
    }

    return 'bg-gray-100 text-gray-700'
}

export default function AdminSellersPage() {
    const {
        data,
        isLoading,
        isError,
    } = useQuery<PageResponse<AdminSellerItem>>({
        queryKey: ['adminSellers', 'pending'],
        queryFn: () => adminSellerApi.list('pending', 0, 20),
    })

    const sellers = data?.content ?? []

    if (isLoading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Đang tải danh sách seller...
            </div>
        )
    }

    if (isError) {
        return (
            <div className="p-6 text-sm text-red-500">
                Không thể tải danh sách seller
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">
                    Hồ sơ seller chờ duyệt
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Chọn hồ sơ để xem thông tin và giấy tờ trước khi duyệt.
                </p>
            </div>

            {sellers.length === 0 ? (
                <div className="rounded-lg border bg-white p-6 text-sm text-gray-500">
                    Không có seller nào đang chờ duyệt.
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border bg-white">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Người đăng ký</th>
                            <th className="px-4 py-3">CCCD</th>
                            <th className="px-4 py-3">Mã thuế</th>
                            <th className="px-4 py-3">Số giấy tờ</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Thao tác</th>
                        </tr>
                        </thead>

                        <tbody>
                        {sellers.map((seller) => (
                            <tr key={seller.sellerId} className="border-t">
                                <td className="px-4 py-3">
                                    {seller.sellerId}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-800">
                                        {seller.fullName || 'Không rõ'}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        {seller.email}
                                    </div>

                                    <div className="text-xs text-gray-400">
                                        {seller.phoneNumber}
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    {seller.identityNumber ?? '-'}
                                </td>

                                <td className="px-4 py-3">
                                    {seller.taxCode ?? '-'}
                                </td>

                                <td className="px-4 py-3">
                                    {seller.documents?.length ?? 0}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={[
                                            'rounded-full px-2 py-1 text-xs',
                                            statusBadge(seller.verificationStatus),
                                        ].join(' ')}
                                    >
                                        {seller.verificationStatus}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <Link
                                        to={`/admin/sellers/${seller.sellerId}`}
                                        className="inline-flex items-center gap-1 rounded bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
                                    >
                                        <Eye size={14} />
                                        Xem hồ sơ
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}