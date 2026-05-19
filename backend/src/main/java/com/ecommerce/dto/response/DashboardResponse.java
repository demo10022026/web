package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter @Builder
public class DashboardResponse {

    // ── Tổng quan ─────────────────────────────────────────────
    private long totalUsers;
    private long totalSellers;
    private long totalProducts;
    private long totalOrders;
    private BigDecimal totalRevenue;

    // NEW
    private long approvedSellerCount;

    // ── Người dùng mới ────────────────────────────────────────
    private long newUsersToday;
    private long newUsersThisWeek;
    private long newUsersThisMonth;
    private List<DailyCount> newUsersTrend;

    // ── Seller chờ duyệt ──────────────────────────────────────
    private long pendingSellerCount;
    private List<PendingSellerItem> recentPendingSellers;

    // ── Top sản phẩm ──────────────────────────────────────────
    private List<TopProduct> topByQuantity;
    private List<TopProduct> topByRevenue;

    // ─────────────────────────────────────────────────────────
    @Getter @Builder
    public static class DailyCount {
        private LocalDate date;
        private long count;
    }

    @Getter @Builder
    public static class PendingSellerItem {
        private Integer sellerId;
        private String  fullName;
        private String  email;
        private String  identityNumber;

        // NEW
        private String verificationStatus;

        private int documentCount;
        private String createdAt;
    }

    @Getter @Builder
    public static class TopProduct {
        private int rank;
        private Integer productId;
        private String productName;
        private String thumbnailUrl;
        private String shopName;
        private String categoryName;
        private long totalQuantity;
        private BigDecimal totalRevenue;
    }
}