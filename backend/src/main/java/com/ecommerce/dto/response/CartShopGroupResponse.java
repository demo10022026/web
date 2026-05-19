package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class CartShopGroupResponse {

    private Integer shopId;
    private String shopName;
    private String shopSlug;

    private List<CartItemResponse> items;

    private Integer totalQuantity;
    private BigDecimal subtotal;
}