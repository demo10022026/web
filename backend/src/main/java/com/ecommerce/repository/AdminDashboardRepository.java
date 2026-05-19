package com.ecommerce.repository;

import com.ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AdminDashboardRepository extends JpaRepository<User, Integer> {

    // ── Đếm user mới theo khoảng thời gian ───────────────────
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :from AND u.createdAt < :to")
    long countNewUsers(@Param("from") LocalDateTime from,
                       @Param("to")   LocalDateTime to);

    // ── Trend user theo từng ngày ─────────────────────────────
    @Query(value = """
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt
        FROM users
        WHERE created_at >= :from AND created_at < :to
        GROUP BY DATE(created_at)
        ORDER BY day ASC
        """, nativeQuery = true)
    List<Object[]> countNewUsersByDay(@Param("from") LocalDateTime from,
                                      @Param("to")   LocalDateTime to);

    // ── Tổng số user, seller, product, order ─────────────────
    @Query("SELECT COUNT(u) FROM User u")
    long countTotalUsers();

    // ── Top sản phẩm bán nhiều nhất (theo số lượng) ───────────
    @Query(value = """
        SELECT
            p.product_id,
            p.product_name,
            p.thumbnail_url,
            sh.shop_name,
            c.category_name,
            SUM(oi.quantity)        AS total_qty,
            SUM(oi.quantity * oi.price) AS total_revenue
        FROM order_items oi
        JOIN products p   ON oi.product_id  = p.product_id
        JOIN shops sh     ON p.shop_id      = sh.shop_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        JOIN orders o     ON oi.order_id    = o.order_id
        WHERE o.order_status NOT IN ('cancelled','returned')
        GROUP BY p.product_id, p.product_name, p.thumbnail_url, sh.shop_name, c.category_name
        ORDER BY total_qty DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopProductsByQuantity(@Param("limit") int limit);

    // ── Top sản phẩm doanh thu cao nhất ───────────────────────
    @Query(value = """
        SELECT
            p.product_id,
            p.product_name,
            p.thumbnail_url,
            sh.shop_name,
            c.category_name,
            SUM(oi.quantity)             AS total_qty,
            SUM(oi.quantity * oi.price)  AS total_revenue
        FROM order_items oi
        JOIN products p   ON oi.product_id  = p.product_id
        JOIN shops sh     ON p.shop_id      = sh.shop_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        JOIN orders o     ON oi.order_id    = o.order_id
        WHERE o.order_status NOT IN ('cancelled','returned')
        GROUP BY p.product_id, p.product_name, p.thumbnail_url, sh.shop_name, c.category_name
        ORDER BY total_revenue DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopProductsByRevenue(@Param("limit") int limit);
}