package com.ecommerce.service;

import com.ecommerce.dto.response.NotificationResponse;
import com.ecommerce.dto.response.UnreadNotificationCountResponse;
import com.ecommerce.entity.User;
import org.springframework.data.domain.Page;

public interface NotificationService {

    Page<NotificationResponse> getMyNotifications(String email, int page, int size);

    UnreadNotificationCountResponse getUnreadCount(String email);

    NotificationResponse markAsRead(String email, Integer notificationId);

    void markAllAsRead(String email);

    NotificationResponse createAndPush(
            User recipient,
            String type,
            String title,
            String content,
            String targetUrl,
            String refType,
            Integer refId
    );
}
