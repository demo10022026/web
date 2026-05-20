package com.ecommerce.service;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.AdminResetPasswordResponse;
import com.ecommerce.dto.response.AdminUserResponse;
import com.ecommerce.dto.response.AdminUserStatsResponse;
import org.springframework.data.domain.Page;

public interface AdminUserService {

    Page<AdminUserResponse> getUsers(
            String keyword,
            String role,
            String status,
            int page,
            int size
    );

    AdminUserResponse getUserDetail(Integer userId);

    AdminUserResponse updateUser(
            String actorEmail,
            Integer userId,
            AdminUpdateUserRequest request
    );

    AdminUserResponse updateUserProfile(
            String actorEmail,
            Integer userId,
            AdminUpdateUserProfileRequest request
    );

    AdminUserResponse updateUserRole(
            String actorEmail,
            Integer userId,
            AdminUpdateUserRoleRequest request
    );

    AdminUserResponse updateUserStatus(
            String actorEmail,
            Integer userId,
            AdminUpdateUserStatusRequest request
    );

    AdminResetPasswordResponse resetUserPassword(
            String actorEmail,
            Integer userId,
            AdminResetUserPasswordRequest request
    );

    AdminUserStatsResponse getStats();
}
