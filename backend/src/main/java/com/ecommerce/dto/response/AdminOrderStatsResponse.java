package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminOrderStatsResponse {
    private long totalOrders;
    private long pendingOrders;
    private long processingOrders;
    private long shippingOrders;
    private long deliveredOrders;
    private long cancelledOrders;
    private long returnedOrders;
}
