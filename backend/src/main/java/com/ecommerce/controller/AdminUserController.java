package com.ecommerce.controller;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.AdminResetPasswordResponse;
import com.ecommerce.dto.response.AdminUserResponse;
import com.ecommerce.dto.response.AdminUserStatsResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.AdminUserService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ApiResponse<Page<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                adminUserService.getUsers(
                        keyword,
                        role,
                        status,
                        page,
                        size
                )
        );
    }

    @GetMapping("/stats")
    public ApiResponse<AdminUserStatsResponse> getStats() {
        return ApiResponse.success(adminUserService.getStats());
    }

    @GetMapping("/{userId}")
    public ApiResponse<AdminUserResponse> getUserDetail(
            @PathVariable Integer userId
    ) {
        return ApiResponse.success(adminUserService.getUserDetail(userId));
    }

    /**
     * Endpoint cũ. Giữ để trang danh sách hoặc code cũ vẫn chạy.
     */
    @PatchMapping("/{userId}")
    public ApiResponse<AdminUserResponse> updateUser(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật tài khoản thành công",
                adminUserService.updateUser(
                        requireEmail(user),
                        userId,
                        request
                )
        );
    }

    @PatchMapping("/{userId}/profile")
    public ApiResponse<AdminUserResponse> updateUserProfile(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserProfileRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật thông tin tài khoản thành công",
                adminUserService.updateUserProfile(
                        requireEmail(user),
                        userId,
                        request
                )
        );
    }

    @PatchMapping("/{userId}/role")
    public ApiResponse<AdminUserResponse> updateUserRole(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserRoleRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật vai trò người dùng thành công",
                adminUserService.updateUserRole(
                        requireEmail(user),
                        userId,
                        request
                )
        );
    }

    @PatchMapping("/{userId}/status")
    public ApiResponse<AdminUserResponse> updateUserStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserStatusRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật trạng thái tài khoản thành công",
                adminUserService.updateUserStatus(
                        requireEmail(user),
                        userId,
                        request
                )
        );
    }

    @PostMapping("/{userId}/reset-password")
    public ApiResponse<AdminResetPasswordResponse> resetUserPassword(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer userId,
            @Valid @RequestBody(required = false) AdminResetUserPasswordRequest request
    ) {
        return ApiResponse.success(
                "Reset mật khẩu thành công",
                adminUserService.resetUserPassword(
                        requireEmail(user),
                        userId,
                        request
                )
        );
    }

    private String requireEmail(UserDetails user) {
        if (user == null) {
            throw new AppException(
                    "Phiên đăng nhập đã hết hạn",
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED"
            );
        }

        return user.getUsername();
    }
}
