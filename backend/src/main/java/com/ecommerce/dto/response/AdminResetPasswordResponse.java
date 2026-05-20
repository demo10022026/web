package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminResetPasswordResponse {

    private Integer userId;

    private String email;

    private String temporaryPassword;

    private String message;
}
