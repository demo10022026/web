package com.ecommerce.controller;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.response.CheckoutPlaceOrderResponse;
import com.ecommerce.dto.response.CheckoutSummaryResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.CheckoutService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping("/summary")
    public ApiResponse<CheckoutSummaryResponse> getSummary(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CheckoutRequest request
    ) {
        return ApiResponse.success(
                checkoutService.getSummary(
                        requireEmail(user),
                        request
                )
        );
    }

    @PostMapping("/place-order")
    public ApiResponse<CheckoutPlaceOrderResponse> placeOrder(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CheckoutRequest request
    ) {
        return ApiResponse.success(
                "Đặt hàng thành công",
                checkoutService.placeOrder(
                        requireEmail(user),
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
