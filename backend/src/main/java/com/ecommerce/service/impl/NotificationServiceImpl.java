package com.ecommerce.service.impl;

import com.ecommerce.dto.response.NotificationResponse;
import com.ecommerce.dto.response.UnreadNotificationCountResponse;
import com.ecommerce.entity.Notification;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.NotificationRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(
            String email,
            int page,
            int size
    ) {
        User user = findUser(email);

        return notificationRepo.findByRecipientOrderByCreatedAtDesc(
                user,
                PageRequest.of(
                        Math.max(page, 0),
                        Math.min(Math.max(size, 1), 50)
                )
        ).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse getUnreadCount(String email) {
        User user = findUser(email);

        return UnreadNotificationCountResponse.builder()
                .unreadCount(notificationRepo.countByRecipientAndIsReadFalse(user))
                .build();
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(
            String email,
            Integer notificationId
    ) {
        User user = findUser(email);

        Notification notification = notificationRepo
                .findByNotificationIdAndRecipient(notificationId, user)
                .orElseThrow(() -> AppException.notFound("Thông báo"));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
        }

        return toResponse(notificationRepo.save(notification));
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        User user = findUser(email);
        notificationRepo.markAllAsRead(user, LocalDateTime.now());
    }

    @Override
    @Transactional
    public NotificationResponse createAndPush(
            User recipient,
            String type,
            String title,
            String content,
            String targetUrl,
            String refType,
            Integer refId
    ) {
        if (recipient == null || recipient.getUserId() == null) {
            throw new AppException(
                    "Người nhận thông báo không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_NOTIFICATION_RECIPIENT"
            );
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .content(content)
                .targetUrl(targetUrl)
                .refType(refType)
                .refId(refId)
                .isRead(false)
                .build();

        NotificationResponse response = toResponse(notificationRepo.save(notification));

        messagingTemplate.convertAndSendToUser(
                recipient.getEmail(),
                "/queue/notifications",
                response
        );

        return response;
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .type(notification.getType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .targetUrl(notification.getTargetUrl())
                .refType(notification.getRefType())
                .refId(notification.getRefId())
                .isRead(Boolean.TRUE.equals(notification.getIsRead()))
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
