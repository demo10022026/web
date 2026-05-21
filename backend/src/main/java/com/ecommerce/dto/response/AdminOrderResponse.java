package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminOrderResponse {

    private Integer orderId;
    private String orderCode;
    private String orderStatus;

    private Integer customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private String receiverName;
    private String receiverPhone;
    private String provinceName;
    private String districtName;
    private String wardName;
    private String shippingAddress;
    private String fullShippingAddress;

    private Integer shippingProviderId;
    private String shippingProviderName;
    private String ghnOrderCode;
    private String trackingCode;

    private BigDecimal subtotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    private PaymentInfo payment;

    private LocalDateTime createdAt;

    private List<ShopGroup> shops;
    private List<Item> items;

    @Getter
    @Builder
    public static class PaymentInfo {
        private Integer paymentId;
        private String paymentMethod;
        private String paymentStatus;
        private String transactionCode;
        private LocalDateTime paidAt;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    public static class ShopGroup {
        private Integer shopId;
        private String shopName;
        private String shopSlug;
        private BigDecimal shopSubtotal;
        private List<Item> items;
    }

    @Getter
    @Builder
    public static class Item {
        private Integer orderItemId;

        private Integer shopId;
        private String shopName;
        private String shopSlug;

        private Integer productId;
        private String productName;
        private String thumbnailUrl;

        private Integer variantId;
        private String variantName;
        private String sku;

        private Integer quantity;
        private BigDecimal price;
        private BigDecimal lineTotal;
    }
}
