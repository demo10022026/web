package com.ecommerce.service;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.response.CheckoutPlaceOrderResponse;
import com.ecommerce.dto.response.CheckoutSummaryResponse;

public interface CheckoutService {

    CheckoutSummaryResponse getSummary(
            String email,
            CheckoutRequest request
    );

    CheckoutPlaceOrderResponse placeOrder(
            String email,
            CheckoutRequest request
    );
}
