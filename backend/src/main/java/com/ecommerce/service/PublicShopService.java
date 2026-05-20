package com.ecommerce.service;

import com.ecommerce.dto.response.PublicShopResponse;

public interface PublicShopService {

    PublicShopResponse getPublicShop(String shopSlugOrId);
}
