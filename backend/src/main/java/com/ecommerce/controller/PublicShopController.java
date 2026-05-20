package com.ecommerce.controller;

import com.ecommerce.dto.response.PublicShopResponse;
import com.ecommerce.service.PublicShopService;
import com.ecommerce.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/shops")
@RequiredArgsConstructor
public class PublicShopController {

    private final PublicShopService publicShopService;

    @GetMapping("/{shopSlugOrId}")
    public ApiResponse<PublicShopResponse> getPublicShop(
            @PathVariable String shopSlugOrId
    ) {
        return ApiResponse.success(
                publicShopService.getPublicShop(shopSlugOrId)
        );
    }
}
