package com.ecommerce.repository;

import com.ecommerce.entity.ChatConversation;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Integer> {

    Optional<ChatConversation> findByUserAndShop(User user, Shop shop);

    @Query("""
        SELECT c
        FROM ChatConversation c
        JOIN FETCH c.user u
        JOIN FETCH c.shop s
        JOIN FETCH c.sellerUser su
        WHERE c.user = :user OR c.sellerUser = :user
        ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC
    """)
    List<ChatConversation> findByParticipantOrderByLastActivityDesc(
            @Param("user") User user
    );

    @Query("""
        SELECT c
        FROM ChatConversation c
        JOIN FETCH c.user u
        JOIN FETCH c.shop s
        JOIN FETCH c.sellerUser su
        WHERE c.conversationId = :conversationId
    """)
    Optional<ChatConversation> findDetailById(
            @Param("conversationId") Integer conversationId
    );

    @Query("""
        SELECT COALESCE(SUM(
            CASE
                WHEN c.user = :user THEN c.userUnreadCount
                WHEN c.sellerUser = :user THEN c.sellerUnreadCount
                ELSE 0
            END
        ), 0)
        FROM ChatConversation c
        WHERE c.user = :user OR c.sellerUser = :user
    """)
    Long sumUnreadCountByParticipant(
            @Param("user") User user
    );
}
