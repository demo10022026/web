package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CheckoutRequest {

    @NotEmpty(message = "Vui lòng chọn sản phẩm cần thanh toán")
    private List<Integer> cartItemIds;

    private Integer addressId;

    private Integer voucherId;

    private String paymentMethod;
}
