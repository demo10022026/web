package com.ecommerce.controller;

import com.ecommerce.dto.request.UserAddressRequest;
import com.ecommerce.dto.response.UserAddressResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.UserAddressService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
public class UserAddressController {

    private final UserAddressService userAddressService;

    @GetMapping("/my")
    public ApiResponse<List<UserAddressResponse>> getMyAddresses(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ApiResponse.success(
                userAddressService.getMyAddresses(requireEmail(user))
        );
    }

    @PostMapping
    public ApiResponse<UserAddressResponse> createAddress(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody UserAddressRequest request
    ) {
        return ApiResponse.success(
                "Thêm địa chỉ thành công",
                userAddressService.createAddress(
                        requireEmail(user),
                        request
                )
        );
    }

    @PutMapping("/{addressId}")
    public ApiResponse<UserAddressResponse> updateAddress(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer addressId,
            @Valid @RequestBody UserAddressRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật địa chỉ thành công",
                userAddressService.updateAddress(
                        requireEmail(user),
                        addressId,
                        request
                )
        );
    }

    @DeleteMapping("/{addressId}")
    public ApiResponse<Void> deleteAddress(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer addressId
    ) {
        userAddressService.deleteAddress(
                requireEmail(user),
                addressId
        );

        return ApiResponse.success("Xóa địa chỉ thành công", null);
    }

    @PutMapping("/{addressId}/default")
    public ApiResponse<UserAddressResponse> setDefaultAddress(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer addressId
    ) {
        return ApiResponse.success(
                "Đã đặt làm địa chỉ mặc định",
                userAddressService.setDefaultAddress(
                        requireEmail(user),
                        addressId
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