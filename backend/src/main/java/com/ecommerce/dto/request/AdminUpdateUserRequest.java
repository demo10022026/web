package com.ecommerce.dto.request;

import com.ecommerce.entity.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateUserRequest {

    private User.Role role;

    private User.AccountStatus accountStatus;
}
