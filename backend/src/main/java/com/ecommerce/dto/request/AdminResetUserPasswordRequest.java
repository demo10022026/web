package com.ecommerce.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminResetUserPasswordRequest {

    /**
     * Nếu để trống, backend tự sinh mật khẩu tạm.
     */
    @Size(min = 8, max = 100, message = "Mật khẩu tạm phải từ 8 đến 100 ký tự")
    private String temporaryPassword;
}
