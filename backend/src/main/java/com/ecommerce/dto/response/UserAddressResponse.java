package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserAddressResponse {

    private Integer addressId;

    private String receiverName;
    private String receiverPhone;

    private String provinceCode;
    private String districtCode;
    private String wardCode;

    private String provinceName;
    private String districtName;
    private String wardName;

    private String addressLine;
    private String fullAddress;

    private String addressType;
    private Boolean isDefault;

    private LocalDateTime createdAt;
}