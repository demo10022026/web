package com.ecommerce.service;

import com.ecommerce.dto.request.UpdateSellerOrderStatusRequest;
import com.ecommerce.dto.response.SellerOrderResponse;
import org.springframework.data.domain.Page;

public interface SellerOrderService {

    Page<SellerOrderResponse> getMyShopOrders(
            String email,
            String status,
            String keyword,
            int page,
            int size
    );

    SellerOrderResponse getMyShopOrderDetail(
            String email,
            Integer orderId
    );

    SellerOrderResponse updateOrderStatus(
            String email,
            Integer orderId,
            UpdateSellerOrderStatusRequest request
    );
}