package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ChatMessageRequest;
import com.ecommerce.dto.response.ChatConversationResponse;
import com.ecommerce.dto.response.ChatMessageResponse;
import com.ecommerce.entity.ChatConversation;
import com.ecommerce.entity.ChatMessage;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.ChatConversationRepository;
import com.ecommerce.repository.ChatMessageRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final UserRepository userRepo;
    private final ShopRepository shopRepo;
    private final ChatConversationRepository conversationRepo;
    private final ChatMessageRepository messageRepo;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ChatConversationResponse startConversationWithShop(
            String email,
            Integer shopId
    ) {
        User currentUser = findUser(email);

        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> AppException.notFound("Shop"));

        return startConversation(currentUser, shop);
    }

    @Override
    @Transactional
    public ChatConversationResponse startConversationWithShopKey(
            String email,
            String shopKey
    ) {
        User currentUser = findUser(email);
        Shop shop = resolveShop(shopKey);

        return startConversation(currentUser, shop);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatConversationResponse> getMyConversations(String email) {
        User currentUser = findUser(email);

        return conversationRepo.findByParticipantOrderByLastActivityDesc(currentUser)
                .stream()
                .map(conversation -> toConversationResponse(conversation, currentUser))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessages(
            String email,
            Integer conversationId,
            int page,
            int size
    ) {
        User currentUser = findUser(email);
        ChatConversation conversation = findConversationAndValidateParticipant(
                conversationId,
                currentUser
        );

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100)
        );

        return messageRepo.findByConversationOrderByCreatedAtDesc(
                conversation,
                pageable
        ).map(message -> toMessageResponse(message, currentUser));
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(
            String email,
            Integer conversationId,
            ChatMessageRequest request
    ) {
        User sender = findUser(email);
        ChatConversation conversation = findConversationAndValidateParticipant(
                conversationId,
                sender
        );

        String content = normalizeMessage(request == null ? null : request.getContent());

        User receiver = getReceiver(conversation, sender);

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .messageType(ChatMessage.MessageType.text)
                .content(content)
                .read(false)
                .build();

        ChatMessage saved = messageRepo.save(message);

        conversation.setLastMessage(content);
        conversation.setLastMessageAt(LocalDateTime.now());

        if (isBuyer(conversation, sender)) {
            conversation.setSellerUnreadCount(safeInt(conversation.getSellerUnreadCount()) + 1);
        } else {
            conversation.setUserUnreadCount(safeInt(conversation.getUserUnreadCount()) + 1);
        }

        conversationRepo.save(conversation);

        ChatMessageResponse senderPayload = toMessageResponse(saved, sender);
        ChatMessageResponse receiverPayload = toMessageResponse(saved, receiver);

        pushMessage(sender, senderPayload);
        pushMessage(receiver, receiverPayload);

        return senderPayload;
    }

    @Override
    @Transactional
    public ChatConversationResponse markAsRead(
            String email,
            Integer conversationId
    ) {
        User reader = findUser(email);
        ChatConversation conversation = findConversationAndValidateParticipant(
                conversationId,
                reader
        );

        messageRepo.markMessagesAsReadByConversationAndReader(
                conversation,
                reader,
                LocalDateTime.now()
        );

        if (isBuyer(conversation, reader)) {
            conversation.setUserUnreadCount(0);
        } else {
            conversation.setSellerUnreadCount(0);
        }

        ChatConversation saved = conversationRepo.save(conversation);

        return toConversationResponse(saved, reader);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User currentUser = findUser(email);

        Long count = conversationRepo.sumUnreadCountByParticipant(currentUser);

        return count == null ? 0 : count;
    }

    private ChatConversationResponse startConversation(
            User currentUser,
            Shop shop
    ) {
        if (shop.getSeller() == null || shop.getSeller().getUser() == null) {
            throw new AppException(
                    "Shop chưa có tài khoản người bán hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "SHOP_SELLER_NOT_FOUND"
            );
        }

        User sellerUser = shop.getSeller().getUser();

        if (sellerUser.getUserId().equals(currentUser.getUserId())) {
            throw new AppException(
                    "Bạn không thể tự chat với shop của mình",
                    HttpStatus.BAD_REQUEST,
                    "CANNOT_CHAT_OWN_SHOP"
            );
        }

        ChatConversation conversation = conversationRepo.findByUserAndShop(
                currentUser,
                shop
        ).orElseGet(() -> conversationRepo.save(
                ChatConversation.builder()
                        .user(currentUser)
                        .shop(shop)
                        .sellerUser(sellerUser)
                        .userUnreadCount(0)
                        .sellerUnreadCount(0)
                        .build()
        ));

        return toConversationResponse(conversation, currentUser);
    }

    private ChatConversation findConversationAndValidateParticipant(
            Integer conversationId,
            User currentUser
    ) {
        ChatConversation conversation = conversationRepo.findDetailById(conversationId)
                .orElseThrow(() -> AppException.notFound("Cuộc trò chuyện"));

        if (!isParticipant(conversation, currentUser)) {
            throw new AppException(
                    "Bạn không có quyền truy cập cuộc trò chuyện này",
                    HttpStatus.FORBIDDEN,
                    "CHAT_FORBIDDEN"
            );
        }

        return conversation;
    }

    private Shop resolveShop(String shopKey) {
        String clean = normalizeText(shopKey);

        if (clean == null) {
            throw new AppException(
                    "Shop không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SHOP"
            );
        }

        try {
            Integer shopId = Integer.parseInt(clean);

            return shopRepo.findById(shopId)
                    .orElseThrow(() -> AppException.notFound("Shop"));
        } catch (NumberFormatException ignored) {
            return shopRepo.findByShopSlug(clean)
                    .orElseThrow(() -> AppException.notFound("Shop"));
        }
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private boolean isParticipant(
            ChatConversation conversation,
            User user
    ) {
        Integer userId = user.getUserId();

        return conversation.getUser().getUserId().equals(userId)
                || conversation.getSellerUser().getUserId().equals(userId);
    }

    private boolean isBuyer(
            ChatConversation conversation,
            User user
    ) {
        return conversation.getUser().getUserId().equals(user.getUserId());
    }

    private User getReceiver(
            ChatConversation conversation,
            User sender
    ) {
        return isBuyer(conversation, sender)
                ? conversation.getSellerUser()
                : conversation.getUser();
    }

    private ChatConversationResponse toConversationResponse(
            ChatConversation conversation,
            User currentUser
    ) {
        User buyer = conversation.getUser();
        User sellerUser = conversation.getSellerUser();
        Shop shop = conversation.getShop();

        int myUnreadCount = isBuyer(conversation, currentUser)
                ? safeInt(conversation.getUserUnreadCount())
                : safeInt(conversation.getSellerUnreadCount());

        return ChatConversationResponse.builder()
                .conversationId(conversation.getConversationId())

                .userId(buyer.getUserId())
                .userName(displayName(buyer))
                .userAvatarUrl(buyer.getAvatarUrl())

                .sellerUserId(sellerUser.getUserId())
                .sellerUserName(displayName(sellerUser))
                .sellerAvatarUrl(sellerUser.getAvatarUrl())

                .shopId(shop.getShopId())
                .shopName(shop.getShopName())
                .shopSlug(shop.getShopSlug())
                .shopAvatarUrl(shop.getAvatarUrl())

                .lastMessage(conversation.getLastMessage())
                .lastMessageAt(conversation.getLastMessageAt())

                .userUnreadCount(safeInt(conversation.getUserUnreadCount()))
                .sellerUnreadCount(safeInt(conversation.getSellerUnreadCount()))
                .myUnreadCount(myUnreadCount)

                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private ChatMessageResponse toMessageResponse(
            ChatMessage message,
            User currentUser
    ) {
        User sender = message.getSender();

        return ChatMessageResponse.builder()
                .messageId(message.getMessageId())
                .conversationId(message.getConversation().getConversationId())
                .senderId(sender.getUserId())
                .senderName(displayName(sender))
                .senderAvatarUrl(sender.getAvatarUrl())
                .messageType(message.getMessageType() == null
                        ? "text"
                        : message.getMessageType().name())
                .content(message.getContent())
                .read(Boolean.TRUE.equals(message.getRead()))
                .mine(sender.getUserId().equals(currentUser.getUserId()))
                .createdAt(message.getCreatedAt())
                .build();
    }

    private void pushMessage(
            User recipient,
            ChatMessageResponse payload
    ) {
        if (recipient == null || recipient.getEmail() == null) {
            return;
        }

        messagingTemplate.convertAndSendToUser(
                recipient.getEmail(),
                "/queue/chat",
                payload
        );
    }

    private String displayName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }

        return user.getUsername() == null ? "Người dùng" : user.getUsername();
    }

    private String normalizeMessage(String value) {
        String clean = normalizeText(value);

        if (clean == null) {
            throw new AppException(
                    "Nội dung tin nhắn không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "EMPTY_CHAT_MESSAGE"
            );
        }

        return clean.length() > 2000 ? clean.substring(0, 2000) : clean;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
