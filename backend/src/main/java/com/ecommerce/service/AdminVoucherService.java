package com.ecommerce.service;

import com.ecommerce.dto.request.AdminUpdateVoucherStatusRequest;
import com.ecommerce.dto.request.AdminVoucherRequest;
import com.ecommerce.dto.response.AdminVoucherResponse;
import com.ecommerce.dto.response.AdminVoucherShopLookupResponse;
import com.ecommerce.dto.response.AdminVoucherStatsResponse;
import org.springframework.data.domain.Page;

public interface AdminVoucherService {

    Page<AdminVoucherResponse> getVouchers(
            String scope,
            String status,
            String keyword,
            int page,
            int size
    );

    AdminVoucherShopLookupResponse getShopLookup(Integer shopId);

    AdminVoucherStatsResponse getStats();

    AdminVoucherResponse getVoucherDetail(Integer voucherId);

    AdminVoucherResponse createVoucher(
            String actorEmail,
            AdminVoucherRequest request
    );

    AdminVoucherResponse updateVoucher(
            String actorEmail,
            Integer voucherId,
            AdminVoucherRequest request
    );

    AdminVoucherResponse updateVoucherStatus(
            String actorEmail,
            Integer voucherId,
            AdminUpdateVoucherStatusRequest request
    );
}
