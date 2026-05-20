package com.ecommerce.dto.request;

import com.ecommerce.entity.UserAddress;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAddressRequest {

    @NotBlank(message = "Tên người nhận không được để trống")
    private String receiverName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String receiverPhone;

    private String provinceCode;
    private String districtCode;
    private String wardCode;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String provinceName;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String districtName;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String wardName;

    @NotBlank(message = "Địa chỉ cụ thể không được để trống")
    private String addressLine;

    private UserAddress.AddressType addressType = UserAddress.AddressType.home;

    private Boolean isDefault = false;
}