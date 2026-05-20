package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class CheckoutSummaryResponse {

    private List<ShopGroup> shops;

    private Integer totalItems;
    private Integer totalQuantity;

    private BigDecimal subtotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    private AppliedVoucher appliedVoucher;

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
        private Integer cartItemId;
        private Integer productId;
        private String productName;
        private String thumbnailUrl;

        private Integer variantId;
        private String variantName;
        private String sku;
        private String variantImageUrl;

        private Integer quantity;
        private Integer stockQuantity;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private BigDecimal lineTotal;
    }

    @Getter
    @Builder
    public static class AppliedVoucher {
        private Integer voucherId;
        private String code;
        private String voucherName;
        private String discountType;
        private BigDecimal discountValue;
        private BigDecimal discountAmount;
        private Integer shopId;
        private String shopName;
        private String scope;
    }
}
