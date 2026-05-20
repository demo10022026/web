package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateShopRequest {

    @NotBlank(message = "Tên shop không được để trống")
    @Size(max = 150, message = "Tên shop tối đa 150 ký tự")
    private String shopName;

    @Size(max = 1000, message = "Mô tả shop tối đa 1000 ký tự")
    private String description;
}