package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class SellerAnalyticsResponse {

    private LocalDate fromDate;
    private LocalDate toDate;

    private Summary summary;
    private List<DailyRevenue> dailyRevenue;
    private List<StatusStat> statusStats;
    private List<TopProduct> topProducts;
    private List<RecentOrder> recentOrders;

    @Getter
    @Builder
    public static class Summary {
        private BigDecimal revenue;
        private BigDecimal grossRevenue;
        private BigDecimal pendingRevenue;
        private BigDecimal cancelledRevenue;
        private BigDecimal returnedRevenue;

        private Integer orderCount;
        private Integer deliveredOrderCount;
        private Integer pendingOrderCount;
        private Integer cancelledOrderCount;
        private Integer returnedOrderCount;

        private Integer soldQuantity;
        private BigDecimal averageOrderValue;

        private BigDecimal completionRate;
        private BigDecimal cancellationRate;
        private BigDecimal returnRate;
    }

    @Getter
    @Builder
    public static class DailyRevenue {
        private LocalDate date;
        private BigDecimal revenue;
        private Integer orderCount;
        private Integer soldQuantity;
    }

    @Getter
    @Builder
    public static class StatusStat {
        private String status;
        private String label;
        private Integer orderCount;
        private BigDecimal revenue;
    }

    @Getter
    @Builder
    public static class TopProduct {
        private Integer productId;
        private String productName;
        private String thumbnailUrl;

        private Integer quantitySold;
        private Integer orderCount;
        private BigDecimal revenue;
    }

    @Getter
    @Builder
    public static class RecentOrder {
        private Integer orderId;
        private String orderCode;
        private String orderStatus;

        private String customerName;
        private String receiverName;
        private String receiverPhone;
        private String fullShippingAddress;

        private BigDecimal shopSubtotalAmount;
        private LocalDateTime createdAt;
    }
}
