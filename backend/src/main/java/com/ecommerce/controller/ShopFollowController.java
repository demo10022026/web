package com.ecommerce.controller;

import com.ecommerce.dto.response.FollowingShopResponse;
import com.ecommerce.dto.response.ShopFollowStatusResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.ShopFollowService;
import com.ecommerce.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ShopFollowController {

    private final ShopFollowService shopFollowService;

    @PostMapping("/shops/{shopId}/follow")
    public ApiResponse<ShopFollowStatusResponse> followShop(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer shopId
    ) {
        return ApiResponse.success(
                "Đã theo dõi shop",
                shopFollowService.followShop(requireEmail(user), shopId)
        );
    }

    @DeleteMapping("/shops/{shopId}/follow")
    public ApiResponse<ShopFollowStatusResponse> unfollowShop(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer shopId
    ) {
        return ApiResponse.success(
                "Đã bỏ theo dõi shop",
                shopFollowService.unfollowShop(requireEmail(user), shopId)
        );
    }

    @GetMapping("/shops/{shopId}/follow-status")
    public ApiResponse<ShopFollowStatusResponse> getFollowStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer shopId
    ) {
        return ApiResponse.success(
                shopFollowService.getFollowStatus(requireEmail(user), shopId)
        );
    }

    @GetMapping("/users/me/following-shops")
    public ApiResponse<Page<FollowingShopResponse>> getMyFollowingShops(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ApiResponse.success(
                shopFollowService.getMyFollowingShops(
                        requireEmail(user),
                        page,
                        size
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
