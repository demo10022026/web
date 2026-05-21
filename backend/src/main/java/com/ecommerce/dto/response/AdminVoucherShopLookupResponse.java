package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminVoucherShopLookupResponse {

    private Integer shopId;
    private String shopName;
    private String shopSlug;
    private String shopStatus;
}