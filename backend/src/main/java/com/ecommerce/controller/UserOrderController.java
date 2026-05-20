package com.ecommerce.controller;

import com.ecommerce.dto.response.UserOrderResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.UserOrderService;
import com.ecommerce.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class UserOrderController {

    private final UserOrderService userOrderService;

    @GetMapping("/my")
    public ApiResponse<List<UserOrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(
                userOrderService.getMyOrders(
                        requireEmail(user),
                        status,
                        keyword
                )
        );
    }

    @PutMapping("/{orderId}/cancel")
    public ApiResponse<UserOrderResponse> cancelOrder(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer orderId
    ) {
        return ApiResponse.success(
                userOrderService.cancelOrder(
                        requireEmail(user),
                        orderId
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