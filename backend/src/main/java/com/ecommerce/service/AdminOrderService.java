package com.ecommerce.service;

import com.ecommerce.dto.request.AdminUpdateOrderStatusRequest;
import com.ecommerce.dto.response.AdminOrderResponse;
import com.ecommerce.dto.response.AdminOrderStatsResponse;
import org.springframework.data.domain.Page;

public interface AdminOrderService {

    Page<AdminOrderResponse> getOrders(
            String status,
            String keyword,
            int page,
            int size
    );

    AdminOrderStatsResponse getStats();

    AdminOrderResponse getOrderDetail(Integer orderId);

    AdminOrderResponse updateOrderStatus(
            Integer orderId,
            AdminUpdateOrderStatusRequest request
    );
}
