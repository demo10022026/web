package com.ecommerce.repository;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    long countByOrderStatus(Order.OrderStatus status);

    List<Order> findByUserOrderByCreatedAtDesc(User user);

    List<Order> findByUserAndOrderStatusOrderByCreatedAtDesc(
            User user,
            Order.OrderStatus orderStatus
    );

    Optional<Order> findByOrderIdAndUser(Integer orderId, User user);

    @Query(
            value = """
                SELECT DISTINCT o
                FROM OrderItem oi
                JOIN oi.order o
                LEFT JOIN oi.product p
                LEFT JOIN oi.variant v
                WHERE oi.shop = :shop
                AND (:status IS NULL OR o.orderStatus = :status)
                AND (
                    :keyword IS NULL
                    OR (:keywordOrderId IS NOT NULL AND o.orderId = :keywordOrderId)
                    OR LOWER(o.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.receiverPhone) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.variantName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                ORDER BY o.createdAt DESC
            """,
            countQuery = """
                SELECT COUNT(DISTINCT o)
                FROM OrderItem oi
                JOIN oi.order o
                LEFT JOIN oi.product p
                LEFT JOIN oi.variant v
                WHERE oi.shop = :shop
                AND (:status IS NULL OR o.orderStatus = :status)
                AND (
                    :keyword IS NULL
                    OR (:keywordOrderId IS NOT NULL AND o.orderId = :keywordOrderId)
                    OR LOWER(o.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.receiverPhone) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.variantName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
            """
    )
    Page<Order> searchSellerOrders(
            @Param("shop") Shop shop,
            @Param("status") Order.OrderStatus status,
            @Param("keyword") String keyword,
            @Param("keywordOrderId") Integer keywordOrderId,
            Pageable pageable
    );

    @Query("""
        SELECT DISTINCT o
        FROM OrderItem oi
        JOIN oi.order o
        WHERE oi.shop = :shop
        AND o.orderId = :orderId
    """)
    Optional<Order> findSellerOrderById(
            @Param("shop") Shop shop,
            @Param("orderId") Integer orderId
    );

    @Query(
            value = """
                SELECT DISTINCT o
                FROM OrderItem oi
                JOIN oi.order o
                JOIN o.user u
                LEFT JOIN oi.shop s
                LEFT JOIN oi.product p
                LEFT JOIN oi.variant v
                WHERE (:status IS NULL OR o.orderStatus = :status)
                AND (
                    :keyword IS NULL
                    OR (:keywordOrderId IS NOT NULL AND o.orderId = :keywordOrderId)
                    OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.receiverPhone) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.provinceName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.districtName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.wardName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.variantName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.ghnOrderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.trackingCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                ORDER BY o.createdAt DESC
            """,
            countQuery = """
                SELECT COUNT(DISTINCT o)
                FROM OrderItem oi
                JOIN oi.order o
                JOIN o.user u
                LEFT JOIN oi.shop s
                LEFT JOIN oi.product p
                LEFT JOIN oi.variant v
                WHERE (:status IS NULL OR o.orderStatus = :status)
                AND (
                    :keyword IS NULL
                    OR (:keywordOrderId IS NOT NULL AND o.orderId = :keywordOrderId)
                    OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.receiverPhone) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.shippingAddress) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.provinceName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.districtName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.wardName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.variantName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.ghnOrderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.trackingCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
            """
    )
    Page<Order> adminSearchOrders(
            @Param("status") Order.OrderStatus status,
            @Param("keyword") String keyword,
            @Param("keywordOrderId") Integer keywordOrderId,
            Pageable pageable
    );
    @Query("""
    SELECT COALESCE(SUM(o.totalAmount), 0)
    FROM Order o
    WHERE o.orderStatus = :status
""")
    BigDecimal sumTotalAmountByOrderStatus(
            @Param("status") Order.OrderStatus status
    );
}
