package com.ecommerce.repository;

import com.ecommerce.entity.ChatConversation;
import com.ecommerce.entity.ChatMessage;
import com.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    @Query("""
        SELECT m
        FROM ChatMessage m
        JOIN FETCH m.sender s
        WHERE m.conversation = :conversation
        ORDER BY m.createdAt DESC
    """)
    Page<ChatMessage> findByConversationOrderByCreatedAtDesc(
            @Param("conversation") ChatConversation conversation,
            Pageable pageable
    );

    @Modifying
    @Query("""
        UPDATE ChatMessage m
        SET m.read = true,
            m.readAt = :readAt
        WHERE m.conversation = :conversation
        AND m.sender <> :reader
        AND m.read = false
    """)
    int markMessagesAsReadByConversationAndReader(
            @Param("conversation") ChatConversation conversation,
            @Param("reader") User reader,
            @Param("readAt") LocalDateTime readAt
    );
}
