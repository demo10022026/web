package com.ecommerce.dto.request;

import com.ecommerce.entity.Product;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSellerProductStatusRequest {

    @NotNull(message = "Trạng thái sản phẩm không được để trống")
    private Product.Status productStatus;
}
