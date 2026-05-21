package com.ecommerce.dto.request;

import com.ecommerce.entity.Voucher;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateVoucherStatusRequest {

    @NotNull(message = "Trạng thái voucher không được để trống")
    private Voucher.VoucherStatus voucherStatus;
}
