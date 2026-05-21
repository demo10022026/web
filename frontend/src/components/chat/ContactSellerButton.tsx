import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { MessageCircle } from 'lucide-react'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'

interface Props {
    shopId?: number | null
    shopSlug?: string | null
    className?: string
    children?: ReactNode
}

export default function ContactSellerButton({
    shopId,
    shopSlug,
    className,
    children,
}: Props) {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuthStore()

    const shopKey = shopId ?? shopSlug

    const startMutation = useMutation({
        mutationFn: () => chatApi.startWithShop(shopKey!),
        onSuccess: (conversation) => {
            navigate(`/messages?conversationId=${conversation.conversationId}`)
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể mở cuộc trò chuyện'
            )
        },
    })

    const handleClick = () => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }

        if (!shopKey) {
            toast.error('Không xác định được shop')
            return
        }

        startMutation.mutate()
    }

    return (
        <button
            type="button"
            disabled={startMutation.isPending}
            onClick={handleClick}
            className={
                className ??
                'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60'
            }
        >
            <MessageCircle className="h-4 w-4" />
            {startMutation.isPending
                ? 'Đang mở...'
                : children ?? 'Liên hệ người bán'}
        </button>
    )
}
