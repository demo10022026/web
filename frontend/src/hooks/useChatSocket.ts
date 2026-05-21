import { useEffect, useRef } from 'react'
import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/store/authStore'
import type { ChatMessage } from '@/api/chatApi'

export function useChatSocket(onMessage: (message: ChatMessage) => void) {
    const { accessToken, isAuthenticated } = useAuthStore()
    const callbackRef = useRef(onMessage)

    useEffect(() => {
        callbackRef.current = onMessage
    }, [onMessage])

    useEffect(() => {
        if (!isAuthenticated || !accessToken) return

        const client = new Client({
            webSocketFactory: () => new SockJS('/api/ws'),
            connectHeaders: {
                Authorization: `Bearer ${accessToken}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: () => undefined,
        })

        client.onConnect = () => {
            client.subscribe('/user/queue/chat', (message: IMessage) => {
                try {
                    const payload = JSON.parse(message.body) as ChatMessage
                    callbackRef.current(payload)
                } catch {
                    // Bỏ qua payload lỗi.
                }
            })
        }

        client.activate()

        return () => {
            client.deactivate()
        }
    }, [accessToken, isAuthenticated])
}
