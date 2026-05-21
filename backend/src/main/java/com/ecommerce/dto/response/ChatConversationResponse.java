package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatConversationResponse {

    private Integer conversationId;

    private Integer userId;
    private String userName;
    private String userAvatarUrl;

    private Integer sellerUserId;
    private String sellerUserName;
    private String sellerAvatarUrl;

    private Integer shopId;
    private String shopName;
    private String shopSlug;
    private String shopAvatarUrl;

    private String lastMessage;
    private LocalDateTime lastMessageAt;

    private Integer userUnreadCount;
    private Integer sellerUnreadCount;
    private Integer myUnreadCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
