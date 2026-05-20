package com.ecommerce.dto.request;

import com.ecommerce.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSellerOrderStatusRequest {

    @NotNull(message = "Trạng thái đơn hàng không được để trống")
    private Order.OrderStatus orderStatus;
}