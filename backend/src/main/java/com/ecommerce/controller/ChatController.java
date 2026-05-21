package com.ecommerce.controller;

import com.ecommerce.dto.request.ChatMessageRequest;
import com.ecommerce.dto.response.ChatConversationResponse;
import com.ecommerce.dto.response.ChatMessageResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.ChatService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/shops/{shopId}/start")
    public ApiResponse<ChatConversationResponse> startConversationWithShop(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer shopId
    ) {
        return ApiResponse.success(
                chatService.startConversationWithShop(
                        requireEmail(user),
                        shopId
                )
        );
    }

    @PostMapping("/shops/key/{shopKey}/start")
    public ApiResponse<ChatConversationResponse> startConversationWithShopKey(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String shopKey
    ) {
        return ApiResponse.success(
                chatService.startConversationWithShopKey(
                        requireEmail(user),
                        shopKey
                )
        );
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ChatConversationResponse>> getMyConversations(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ApiResponse.success(
                chatService.getMyConversations(requireEmail(user))
        );
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<Page<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        return ApiResponse.success(
                chatService.getMessages(
                        requireEmail(user),
                        conversationId,
                        page,
                        size
                )
        );
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ApiResponse<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer conversationId,
            @Valid @RequestBody ChatMessageRequest request
    ) {
        return ApiResponse.success(
                "Gửi tin nhắn thành công",
                chatService.sendMessage(
                        requireEmail(user),
                        conversationId,
                        request
                )
        );
    }

    @PatchMapping("/conversations/{conversationId}/read")
    public ApiResponse<ChatConversationResponse> markAsRead(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer conversationId
    ) {
        return ApiResponse.success(
                chatService.markAsRead(
                        requireEmail(user),
                        conversationId
                )
        );
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ApiResponse.success(
                chatService.getUnreadCount(requireEmail(user))
        );
    }

    private String requireEmail(UserDetails user) {
        if (user == null) {
            throw new AppException(
                    "Phiên đăng nhập đã hết hạn",
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED"
            );
        }

        return user.getUsername();
    }
}
