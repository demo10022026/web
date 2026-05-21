package com.ecommerce.repository;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    List<OrderItem> findByOrder(Order order);

    List<OrderItem> findByOrderIn(Collection<Order> orders);

    @Query("""
        SELECT oi
        FROM OrderItem oi
        JOIN FETCH oi.order o
        JOIN FETCH oi.product p
        LEFT JOIN FETCH oi.variant v
        WHERE oi.order IN :orders
        AND oi.shop = :shop
        ORDER BY oi.createdAt ASC
    """)
    List<OrderItem> findByOrderInAndShopWithProductVariant(
            @Param("orders") Collection<Order> orders,
            @Param("shop") Shop shop
    );

    @Query("""
        SELECT oi
        FROM OrderItem oi
        JOIN FETCH oi.order o
        JOIN FETCH oi.product p
        LEFT JOIN FETCH oi.variant v
        WHERE oi.order = :order
        AND oi.shop = :shop
        ORDER BY oi.createdAt ASC
    """)
    List<OrderItem> findByOrderAndShopWithProductVariant(
            @Param("order") Order order,
            @Param("shop") Shop shop
    );

    @Query("""
        SELECT oi
        FROM OrderItem oi
        JOIN FETCH oi.order o
        JOIN FETCH o.user u
        JOIN FETCH oi.product p
        LEFT JOIN FETCH oi.variant v
        WHERE oi.shop = :shop
        AND o.createdAt >= :startAt
        AND o.createdAt < :endAt
        ORDER BY o.createdAt DESC
    """)
    List<OrderItem> findSellerAnalyticsItems(
            @Param("shop") Shop shop,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    @Query("""
        SELECT COUNT(DISTINCT o.orderId)
        FROM OrderItem oi
        JOIN oi.order o
        WHERE oi.shop = :shop
        AND o.orderStatus = :status
    """)
    long countDistinctOrdersByShopAndStatus(
            @Param("shop") Shop shop,
            @Param("status") Order.OrderStatus status
    );

    @Query("""
        SELECT COALESCE(SUM(oi.price * oi.quantity), 0)
        FROM OrderItem oi
        JOIN oi.order o
        WHERE oi.shop = :shop
        AND o.orderStatus = :status
    """)
    BigDecimal sumRevenueByShopAndStatus(
            @Param("shop") Shop shop,
            @Param("status") Order.OrderStatus status
    );

    @Query("""
        SELECT COALESCE(SUM(oi.price * oi.quantity), 0)
        FROM OrderItem oi
        JOIN oi.order o
        WHERE oi.shop = :shop
        AND o.orderStatus = :status
        AND o.createdAt >= :startAt
        AND o.createdAt < :endAt
    """)
    BigDecimal sumRevenueByShopAndStatusBetween(
            @Param("shop") Shop shop,
            @Param("status") Order.OrderStatus status,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    @Query("""
        SELECT oi
        FROM OrderItem oi
        JOIN FETCH oi.order o
        JOIN FETCH o.user u
        JOIN FETCH oi.shop s
        JOIN FETCH oi.product p
        LEFT JOIN FETCH oi.variant v
        WHERE oi.order IN :orders
        ORDER BY oi.createdAt ASC
    """)
    List<OrderItem> adminFindByOrderInWithRelations(
            @Param("orders") Collection<Order> orders
    );

    @Query("""
        SELECT oi
        FROM OrderItem oi
        JOIN FETCH oi.order o
        JOIN FETCH o.user u
        JOIN FETCH oi.shop s
        JOIN FETCH oi.product p
        LEFT JOIN FETCH oi.variant v
        WHERE oi.order = :order
        ORDER BY oi.createdAt ASC
    """)
    List<OrderItem> adminFindByOrderWithRelations(
            @Param("order") Order order
    );
}
