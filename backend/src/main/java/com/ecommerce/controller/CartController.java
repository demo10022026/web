package com.ecommerce.controller;

import com.ecommerce.dto.request.AddToCartRequest;
import com.ecommerce.dto.request.UpdateCartItemRequest;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.service.CartService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ApiResponse<CartResponse> getMyCart(Authentication authentication) {
        return ApiResponse.success(
                cartService.getMyCart(authentication.getName())
        );
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addItem(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequest request
    ) {
        return ApiResponse.success(
                "Đã thêm vào giỏ hàng",
                cartService.addItem(authentication.getName(), request)
        );
    }

    @PutMapping("/items/{cartItemId}")
    public ApiResponse<CartResponse> updateItem(
            Authentication authentication,
            @PathVariable Integer cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return ApiResponse.success(
                "Đã cập nhật giỏ hàng",
                cartService.updateItem(authentication.getName(), cartItemId, request)
        );
    }

    @DeleteMapping("/items/{cartItemId}")
    public ApiResponse<CartResponse> removeItem(
            Authentication authentication,
            @PathVariable Integer cartItemId
    ) {
        return ApiResponse.success(
                "Đã xóa sản phẩm khỏi giỏ hàng",
                cartService.removeItem(authentication.getName(), cartItemId)
        );
    }

    @DeleteMapping("/clear")
    public ApiResponse<CartResponse> clearCart(Authentication authentication) {
        return ApiResponse.success(
                "Đã xóa toàn bộ giỏ hàng",
                cartService.clearCart(authentication.getName())
        );
    }
}