package com.ecommerce.service;

import com.ecommerce.dto.response.VoucherResponse;

import java.util.List;

public interface VoucherService {

    List<VoucherResponse> getAvailableVouchers(
            String email,
            String scope,
            String keyword
    );

    List<VoucherResponse> getMyVouchers(
            String email,
            String status,
            String keyword
    );

    VoucherResponse saveVoucher(
            String email,
            Integer voucherId
    );

    void removeSavedVoucher(
            String email,
            Integer voucherId
    );
}
