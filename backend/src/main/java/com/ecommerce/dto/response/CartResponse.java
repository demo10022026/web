package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class CartResponse {

    private Integer cartId;

    /**
     * Số dòng sản phẩm trong giỏ.
     */
    private Integer totalItems;

    /**
     * Tổng số lượng sản phẩm.
     */
    private Integer totalQuantity;

    private BigDecimal totalAmount;

    private List<CartShopGroupResponse> shops;
}