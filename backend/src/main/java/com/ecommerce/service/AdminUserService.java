package com.ecommerce.service;

import com.ecommerce.dto.request.AdminUpdateUserRequest;
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

    AdminUserStatsResponse getStats();
}
