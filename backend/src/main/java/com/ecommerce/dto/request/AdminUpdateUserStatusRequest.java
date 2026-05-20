package com.ecommerce.dto.request;

import com.ecommerce.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateUserStatusRequest {

    @NotNull(message = "Trạng thái tài khoản không được để trống")
    private User.AccountStatus accountStatus;
}
