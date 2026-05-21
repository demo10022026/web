import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Loader2,
    MessageCircle,
    Package,
    Send,
    Store,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { chatApi, type ChatConversation, type ChatMessage } from '@/api/chatApi'
import { useChatSocket } from '@/hooks/useChatSocket'

function formatTime(value?: string | null) {
    if (!value) return ''

    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    }).format(new Date(value))
}

function ConversationAvatar({ conversation }: { conversation: ChatConversation }) {
    if (conversation.shopAvatarUrl) {
        return (
            <img
                src={conversation.shopAvatarUrl}
                alt={conversation.shopName}
                className="h-11 w-11 rounded-full object-cover"
            />
        )
    }

    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-500">
            <Store className="h-5 w-5" />
        </div>
    )
}

function EmptyConversation() {
    return (
        <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <MessageCircle className="h-14 w-14 text-gray-300" />

            <h2 className="mt-4 text-base font-semibold text-gray-700">
                Chọn một cuộc trò chuyện
            </h2>

            <p className="mt-1 text-sm">
                Tin nhắn giữa bạn và người bán sẽ hiển thị tại đây.
            </p>
        </div>
    )
}

export default function MessagesPage() {
    const queryClient = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()

    const selectedIdParam = searchParams.get('conversationId')
    const selectedConversationId = selectedIdParam
        ? Number(selectedIdParam)
        : null

    const [messageInput, setMessageInput] = useState('')
    const bottomRef = useRef<HTMLDivElement | null>(null)

    const {
        data: conversations = [],
        isLoading: isLoadingConversations,
    } = useQuery({
        queryKey: ['chatConversations'],
        queryFn: chatApi.getConversations,
        staleTime: 0,
    })

    useChatSocket((message) => {
        queryClient.invalidateQueries({ queryKey: ['chatConversations'] })
        queryClient.invalidateQueries({
            queryKey: ['chatMessages', message.conversationId],
        })

        if (selectedConversationId === message.conversationId) {
            chatApi.markAsRead(message.conversationId).catch(() => undefined)
        }
    })

    useEffect(() => {
        if (!selectedConversationId && conversations.length > 0) {
            setSearchParams({
                conversationId: String(conversations[0].conversationId),
            })
        }
    }, [conversations, selectedConversationId, setSearchParams])

    const selectedConversation = useMemo(() => {
        if (!selectedConversationId) return null

        return conversations.find(
            (conversation) =>
                conversation.conversationId === selectedConversationId
        ) ?? null
    }, [conversations, selectedConversationId])

    const {
        data: messagesPage,
        isLoading: isLoadingMessages,
    } = useQuery({
        queryKey: ['chatMessages', selectedConversationId],
        queryFn: () => chatApi.getMessages(selectedConversationId!, 0, 50),
        enabled: !!selectedConversationId,
        staleTime: 0,
    })

    const messages = useMemo(() => {
        return [...(messagesPage?.content ?? [])].reverse()
    }, [messagesPage])

    useEffect(() => {
        if (!selectedConversationId) return

        chatApi.markAsRead(selectedConversationId)
            .then(() => {
                queryClient.invalidateQueries({
                    queryKey: ['chatConversations'],
                })
                queryClient.invalidateQueries({
                    queryKey: ['chatUnreadCount'],
                })
            })
            .catch(() => undefined)
    }, [selectedConversationId, queryClient])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
        })
    }, [messages.length, selectedConversationId])

    const sendMutation = useMutation({
        mutationFn: () =>
            chatApi.sendMessage(
                selectedConversationId!,
                messageInput.trim()
            ),
        onSuccess: (message) => {
            setMessageInput('')
            queryClient.invalidateQueries({
                queryKey: ['chatConversations'],
            })
            queryClient.invalidateQueries({
                queryKey: ['chatMessages', message.conversationId],
            })
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Không thể gửi tin nhắn'
            )
        },
    })

    const handleSelectConversation = (conversationId: number) => {
        setSearchParams({
            conversationId: String(conversationId),
        })
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()

        if (!selectedConversationId) return

        if (!messageInput.trim()) {
            toast.error('Vui lòng nhập nội dung tin nhắn')
            return
        }

        sendMutation.mutate()
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    Tin nhắn
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Trao đổi trực tiếp giữa người mua và người bán.
                </p>
            </div>

            <div className="grid h-[calc(100vh-180px)] min-h-[560px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:grid-cols-[340px_1fr]">
                <aside className="border-r border-gray-100">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="font-semibold text-gray-900">
                            Cuộc trò chuyện
                        </h2>
                    </div>

                    <div className="h-full overflow-y-auto pb-14">
                        {isLoadingConversations ? (
                            <div className="flex h-40 items-center justify-center text-gray-500">
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Đang tải...
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400">
                                <MessageCircle className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                                Chưa có cuộc trò chuyện nào.
                            </div>
                        ) : (
                            conversations.map((conversation) => {
                                const active =
                                    conversation.conversationId ===
                                    selectedConversationId

                                return (
                                    <button
                                        key={conversation.conversationId}
                                        type="button"
                                        onClick={() =>
                                            handleSelectConversation(
                                                conversation.conversationId
                                            )
                                        }
                                        className={[
                                            'flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-orange-50/50',
                                            active ? 'bg-orange-50' : 'bg-white',
                                        ].join(' ')}
                                    >
                                        <ConversationAvatar
                                            conversation={conversation}
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-semibold text-gray-900">
                                                    {conversation.shopName}
                                                </p>

                                                {conversation.myUnreadCount > 0 && (
                                                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                                        {
                                                            conversation.myUnreadCount
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-0.5 truncate text-xs text-gray-400">
                                                {conversation.lastMessage ||
                                                    'Chưa có tin nhắn'}
                                            </p>

                                            <p className="mt-1 text-[11px] text-gray-400">
                                                {formatTime(
                                                    conversation.lastMessageAt
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </aside>

                <section className="flex min-w-0 flex-col">
                    {!selectedConversation ? (
                        <EmptyConversation />
                    ) : (
                        <>
                            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <ConversationAvatar
                                        conversation={selectedConversation}
                                    />

                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {selectedConversation.shopName}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            Người bán:{' '}
                                            {
                                                selectedConversation.sellerUserName
                                            }
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    to={`/shops/${
                                        selectedConversation.shopSlug ||
                                        selectedConversation.shopId
                                    }`}
                                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    <Package className="h-4 w-4" />
                                    Xem shop
                                </Link>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-gray-50 px-5 py-4">
                                {isLoadingMessages ? (
                                    <div className="flex h-full items-center justify-center text-gray-500">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Đang tải tin nhắn...
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
                                        Chưa có tin nhắn. Hãy gửi lời chào tới
                                        người bán.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.map((message: ChatMessage) => (
                                            <div
                                                key={message.messageId}
                                                className={[
                                                    'flex',
                                                    message.mine
                                                        ? 'justify-end'
                                                        : 'justify-start',
                                                ].join(' ')}
                                            >
                                                <div
                                                    className={[
                                                        'max-w-[76%] rounded-2xl px-4 py-2 shadow-sm',
                                                        message.mine
                                                            ? 'rounded-br-sm bg-orange-500 text-white'
                                                            : 'rounded-bl-sm bg-white text-gray-800',
                                                    ].join(' ')}
                                                >
                                                    <p className="whitespace-pre-line text-sm leading-6">
                                                        {message.content}
                                                    </p>

                                                    <p
                                                        className={[
                                                            'mt-1 text-[11px]',
                                                            message.mine
                                                                ? 'text-orange-100'
                                                                : 'text-gray-400',
                                                        ].join(' ')}
                                                    >
                                                        {formatTime(
                                                            message.createdAt
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={bottomRef} />
                                    </div>
                                )}
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="flex items-end gap-3 border-t border-gray-100 bg-white p-4"
                            >
                                <textarea
                                    value={messageInput}
                                    onChange={(e) =>
                                        setMessageInput(e.target.value)
                                    }
                                    rows={1}
                                    placeholder="Nhập tin nhắn..."
                                    className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        sendMutation.isPending ||
                                        !messageInput.trim()
                                    }
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {sendMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Gửi
                                </button>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </div>
    )
}
