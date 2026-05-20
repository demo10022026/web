package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CheckoutPlaceOrderResponse {
    private Integer orderId;
    private String orderCode;
    private BigDecimal totalAmount;
    private String orderStatus;
}
