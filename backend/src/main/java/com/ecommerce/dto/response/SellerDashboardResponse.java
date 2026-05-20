package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class SellerDashboardResponse {

    private ShopResponse shop;

    private Stats stats;

    private Tasks tasks;

    private List<RecentProduct> recentProducts;

    private List<LowStockProduct> lowStockProducts;

    @Getter
    @Builder
    public static class Stats {
        private long totalProducts;
        private long activeProducts;
        private long draftProducts;
        private long inactiveProducts;
        private long bannedProducts;

        private long totalSold;
        private long lowStockVariants;

        private long pendingOrders;

        private BigDecimal todayRevenue;
        private BigDecimal totalRevenue;

        private BigDecimal averageRating;
    }

    @Getter
    @Builder
    public static class Tasks {
        private long newOrders;
        private long lowStockProducts;

        private boolean needAvatar;
        private boolean needBanner;
        private boolean needDescription;
    }

    @Getter
    @Builder
    public static class RecentProduct {
        private Integer productId;
        private String productName;
        private String thumbnailUrl;
        private String productStatus;
        private Integer soldCount;
        private BigDecimal averageRating;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    public static class LowStockProduct {
        private Integer productId;
        private String productName;
        private String thumbnailUrl;

        private Integer variantId;
        private String variantName;
        private String sku;
        private Integer stockQuantity;
    }
}