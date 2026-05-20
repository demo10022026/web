package com.ecommerce.service;

import com.ecommerce.dto.request.UpsertSellerBankAccountRequest;
import com.ecommerce.dto.response.SellerShopProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface SellerShopProfileService {

    SellerShopProfileResponse getMyShopProfile(String email);

    SellerShopProfileResponse updateMyShopProfile(
            String email,
            String shopName,
            String description,
            String shopStatus,
            MultipartFile avatar,
            MultipartFile banner
    );

    SellerShopProfileResponse upsertBankAccount(
            String email,
            UpsertSellerBankAccountRequest request
    );
}
