package com.ecommerce.service;

import com.ecommerce.dto.request.CreateShopRequest;
import com.ecommerce.dto.response.ShopResponse;
import org.springframework.web.multipart.MultipartFile;

public interface SellerShopService {

    ShopResponse getMyShop(String email);

    ShopResponse createShop(
            String email,
            CreateShopRequest request,
            MultipartFile avatar,
            MultipartFile banner
    );
}