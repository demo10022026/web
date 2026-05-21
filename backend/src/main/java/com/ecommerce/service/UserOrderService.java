package com.ecommerce.service;

import com.ecommerce.dto.request.CreateReviewRequest;
import com.ecommerce.dto.response.BuyAgainResponse;
import com.ecommerce.dto.response.UserOrderResponse;
import com.ecommerce.dto.response.UserReviewResponse;

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

    UserReviewResponse createReview(
            String email,
            Integer orderItemId,
            CreateReviewRequest request
    );

    BuyAgainResponse buyAgain(
            String email,
            Integer orderId
    );
}
