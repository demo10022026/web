package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class BuyAgainResponse {

    private List<Integer> cartItemIds;
    private List<SkippedItem> skippedItems;

    @Getter
    @Builder
    public static class SkippedItem {
        private Integer productId;
        private String productName;
        private Integer variantId;
        private String variantName;
        private String reason;
    }
}
