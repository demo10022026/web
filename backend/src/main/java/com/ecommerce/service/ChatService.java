package com.ecommerce.service;

import com.ecommerce.dto.request.ChatMessageRequest;
import com.ecommerce.dto.response.ChatConversationResponse;
import com.ecommerce.dto.response.ChatMessageResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ChatService {

    ChatConversationResponse startConversationWithShop(
            String email,
            Integer shopId
    );

    ChatConversationResponse startConversationWithShopKey(
            String email,
            String shopKey
    );

    List<ChatConversationResponse> getMyConversations(String email);

    Page<ChatMessageResponse> getMessages(
            String email,
            Integer conversationId,
            int page,
            int size
    );

    ChatMessageResponse sendMessage(
            String email,
            Integer conversationId,
            ChatMessageRequest request
    );

    ChatConversationResponse markAsRead(
            String email,
            Integer conversationId
    );

    long getUnreadCount(String email);
}
