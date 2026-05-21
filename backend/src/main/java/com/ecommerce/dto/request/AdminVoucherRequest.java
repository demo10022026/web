package com.ecommerce.dto.request;

import com.ecommerce.entity.Voucher;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class AdminVoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    @Size(max = 50, message = "Mã voucher tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên voucher không được để trống")
    @Size(max = 150, message = "Tên voucher tối đa 150 ký tự")
    private String voucherName;

    @NotNull(message = "Loại giảm giá không được để trống")
    private Voucher.DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0", message = "Mức giảm tối đa không được âm")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0", message = "Đơn tối thiểu không được âm")
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @NotNull(message = "Phạm vi voucher không được để trống")
    private Voucher.Scope scope;

    private Integer shopId;

    @NotNull(message = "Số lượt sử dụng không được để trống")
    @Min(value = 1, message = "Số lượt sử dụng tối thiểu là 1")
    private Integer usageLimit;

    @NotNull(message = "Số lượt mỗi tài khoản không được để trống")
    @Min(value = 1, message = "Số lượt mỗi tài khoản tối thiểu là 1")
    private Integer perUserLimit;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endTime;

    private Voucher.VoucherStatus voucherStatus = Voucher.VoucherStatus.active;
}
