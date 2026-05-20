package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SellerReviewRequest {

    @NotNull(message = "approved không được để trống")
    private Boolean approved;

    private String rejectionReason;
}