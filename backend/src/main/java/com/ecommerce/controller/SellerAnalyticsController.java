package com.ecommerce.controller;

import com.ecommerce.dto.response.SellerAnalyticsResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.SellerAnalyticsService;
import com.ecommerce.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/seller/analytics")
@RequiredArgsConstructor
public class SellerAnalyticsController {

    private final SellerAnalyticsService sellerAnalyticsService;

    @GetMapping
    public ApiResponse<SellerAnalyticsResponse> getMyShopAnalytics(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        return ApiResponse.success(
                sellerAnalyticsService.getMyShopAnalytics(
                        requireEmail(user),
                        fromDate,
                        toDate
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
