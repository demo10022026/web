package com.ecommerce.service;

import com.ecommerce.dto.request.SellerVoucherRequest;
import com.ecommerce.dto.response.SellerVoucherResponse;
import org.springframework.data.domain.Page;

public interface SellerVoucherService {

    Page<SellerVoucherResponse> getMyShopVouchers(
            String email,
            String keyword,
            String status,
            int page,
            int size
    );

    SellerVoucherResponse createVoucher(
            String email,
            SellerVoucherRequest request
    );

    SellerVoucherResponse updateVoucher(
            String email,
            Integer voucherId,
            SellerVoucherRequest request
    );

    SellerVoucherResponse expireVoucher(
            String email,
            Integer voucherId
    );
}
