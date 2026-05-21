package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {

    private Integer messageId;
    private Integer conversationId;

    private Integer senderId;
    private String senderName;
    private String senderAvatarUrl;

    private String messageType;
    private String content;

    private Boolean read;
    private Boolean mine;

    private LocalDateTime createdAt;
}
