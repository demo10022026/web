package com.ecommerce.controller;

import com.ecommerce.dto.response.SellerDashboardResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.SellerDashboardService;
import com.ecommerce.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/seller/dashboard")
@RequiredArgsConstructor
public class SellerDashboardController {

    private final SellerDashboardService sellerDashboardService;

    @GetMapping
    public ApiResponse<SellerDashboardResponse> getDashboard(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ApiResponse.success(
                sellerDashboardService.getDashboard(requireEmail(user))
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