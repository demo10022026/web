package com.ecommerce.controller;

import com.ecommerce.dto.request.UpdateSellerOrderStatusRequest;
import com.ecommerce.dto.response.SellerOrderResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.SellerOrderService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/seller/orders")
@RequiredArgsConstructor
public class SellerOrderController {

    private final SellerOrderService sellerOrderService;

    @GetMapping
    public ApiResponse<Page<SellerOrderResponse>> getMyShopOrders(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                sellerOrderService.getMyShopOrders(
                        requireEmail(user),
                        status,
                        keyword,
                        page,
                        size
                )
        );
    }

    @GetMapping("/{orderId}")
    public ApiResponse<SellerOrderResponse> getMyShopOrderDetail(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer orderId
    ) {
        return ApiResponse.success(
                sellerOrderService.getMyShopOrderDetail(
                        requireEmail(user),
                        orderId
                )
        );
    }

    @PatchMapping("/{orderId}/status")
    public ApiResponse<SellerOrderResponse> updateOrderStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer orderId,
            @Valid @RequestBody UpdateSellerOrderStatusRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật trạng thái đơn hàng thành công",
                sellerOrderService.updateOrderStatus(
                        requireEmail(user),
                        orderId,
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