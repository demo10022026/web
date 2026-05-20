package com.ecommerce.service;

import com.ecommerce.dto.response.VoucherResponse;

import java.util.List;

public interface VoucherService {

    List<VoucherResponse> getAvailableVouchers(
            String email,
            String scope
    );

    List<VoucherResponse> getMyVouchers(
            String email,
            String status
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
