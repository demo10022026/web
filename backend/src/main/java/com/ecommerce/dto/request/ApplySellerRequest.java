package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ApplySellerRequest {

    @NotBlank(message = "Số CMND/CCCD không được để trống")
    @Size(min = 9, max = 20, message = "CMND/CCCD phải từ 9 đến 20 ký tự")
    @Pattern(regexp = "\\d+", message = "Chỉ được nhập số")
    private String identityNumber;

    @Size(max = 50, message = "Mã số thuế tối đa 50 ký tự")
    private String taxCode;
}
