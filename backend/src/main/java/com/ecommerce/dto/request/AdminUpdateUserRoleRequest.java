package com.ecommerce.dto.request;

import com.ecommerce.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateUserRoleRequest {

    @NotNull(message = "Vai trò không được để trống")
    private User.Role role;
}
