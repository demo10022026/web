package com.ecommerce.service;

import com.ecommerce.dto.response.FollowingShopResponse;
import com.ecommerce.dto.response.ShopFollowStatusResponse;
import org.springframework.data.domain.Page;

public interface ShopFollowService {

    ShopFollowStatusResponse followShop(String email, Integer shopId);

    ShopFollowStatusResponse unfollowShop(String email, Integer shopId);

    ShopFollowStatusResponse getFollowStatus(String email, Integer shopId);

    Page<FollowingShopResponse> getMyFollowingShops(String email, int page, int size);
}
