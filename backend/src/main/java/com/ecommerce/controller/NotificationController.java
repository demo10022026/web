package com.ecommerce.controller;

import com.ecommerce.dto.response.NotificationResponse;
import com.ecommerce.dto.response.UnreadNotificationCountResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.NotificationService;
import com.ecommerce.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<Page<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                notificationService.getMyNotifications(
                        requireEmail(user),
                        page,
                        size
                )
        );
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadNotificationCountResponse> getUnreadCount(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ApiResponse.success(
                notificationService.getUnreadCount(requireEmail(user))
        );
    }

    @PatchMapping("/{notificationId}/read")
    public ApiResponse<NotificationResponse> markAsRead(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer notificationId
    ) {
        return ApiResponse.success(
                "Đã đọc thông báo",
                notificationService.markAsRead(requireEmail(user), notificationId)
        );
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails user
    ) {
        notificationService.markAllAsRead(requireEmail(user));
        return ApiResponse.success("Đã đọc tất cả thông báo", null);
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
