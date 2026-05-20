package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReviewSellerRequest {

    @NotNull(message = "Kết quả duyệt không được để trống")
    private Boolean approved;

    private String rejectionReason;
}
