package com.ecommerce.service;

import com.ecommerce.dto.response.UserOrderResponse;

import java.util.List;

public interface UserOrderService {

    List<UserOrderResponse> getMyOrders(
            String email,
            String status,
            String keyword
    );

    UserOrderResponse cancelOrder(
            String email,
            Integer orderId
    );
}