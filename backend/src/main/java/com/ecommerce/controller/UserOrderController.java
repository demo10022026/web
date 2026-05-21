package com.ecommerce.controller;

import com.ecommerce.dto.request.CreateReviewRequest;
import com.ecommerce.dto.response.BuyAgainResponse;
import com.ecommerce.dto.response.UserOrderResponse;
import com.ecommerce.dto.response.UserReviewResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.UserOrderService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
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

    @PostMapping("/items/{orderItemId}/review")
    public ApiResponse<UserReviewResponse> createReview(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer orderItemId,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        return ApiResponse.success(
                "Đánh giá sản phẩm thành công",
                userOrderService.createReview(
                        requireEmail(user),
                        orderItemId,
                        request
                )
        );
    }

    @PostMapping("/{orderId}/buy-again")
    public ApiResponse<BuyAgainResponse> buyAgain(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer orderId
    ) {
        return ApiResponse.success(
                "Đã thêm sản phẩm có thể mua lại vào giỏ hàng",
                userOrderService.buyAgain(
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
