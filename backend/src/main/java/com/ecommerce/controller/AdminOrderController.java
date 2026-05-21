package com.ecommerce.controller;

import com.ecommerce.dto.request.AdminUpdateOrderStatusRequest;
import com.ecommerce.dto.response.AdminOrderResponse;
import com.ecommerce.dto.response.AdminOrderStatsResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.AdminOrderService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping
    public ApiResponse<Page<AdminOrderResponse>> getOrders(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        requireEmail(user);

        return ApiResponse.success(
                adminOrderService.getOrders(
                        status,
                        keyword,
                        page,
                        size
                )
        );
    }

    @GetMapping("/stats")
    public ApiResponse<AdminOrderStatsResponse> getStats(
            @AuthenticationPrincipal UserDetails user
    ) {
        requireEmail(user);

        return ApiResponse.success(adminOrderService.getStats());
    }

    @GetMapping("/{orderId}")
    public ApiResponse<AdminOrderResponse> getOrderDetail(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer orderId
    ) {
        requireEmail(user);

        return ApiResponse.success(
                adminOrderService.getOrderDetail(orderId)
        );
    }

    @PatchMapping("/{orderId}/status")
    public ApiResponse<AdminOrderResponse> updateOrderStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer orderId,
            @Valid @RequestBody AdminUpdateOrderStatusRequest request
    ) {
        requireEmail(user);

        return ApiResponse.success(
                "Cập nhật trạng thái đơn hàng thành công",
                adminOrderService.updateOrderStatus(orderId, request)
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
