package com.ecommerce.dto.request;

import com.ecommerce.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateOrderStatusRequest {

    @NotNull(message = "Trạng thái đơn hàng không được để trống")
    private Order.OrderStatus orderStatus;

    private String trackingCode;

    private String ghnOrderCode;
}
