package com.ecommerce.service.impl;

import com.ecommerce.dto.response.FollowingShopResponse;
import com.ecommerce.dto.response.ShopFollowStatusResponse;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.ShopFollower;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.ShopFollowerRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ShopFollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShopFollowServiceImpl implements ShopFollowService {

    private final UserRepository userRepo;
    private final ShopRepository shopRepo;
    private final ShopFollowerRepository shopFollowerRepo;

    @Override
    @Transactional
    public ShopFollowStatusResponse followShop(
            String email,
            Integer shopId
    ) {
        User user = findUser(email);
        Shop shop = findShop(shopId);

        if (shopFollowerRepo.existsByShopAndUser(shop, user)) {
            return toStatus(shop, true);
        }

        shopFollowerRepo.save(ShopFollower.builder()
                .shop(shop)
                .user(user)
                .build());

        refreshFollowerCount(shop);

        return toStatus(shop, true);
    }

    @Override
    @Transactional
    public ShopFollowStatusResponse unfollowShop(
            String email,
            Integer shopId
    ) {
        User user = findUser(email);
        Shop shop = findShop(shopId);

        shopFollowerRepo.findByShopAndUser(shop, user)
                .ifPresent(shopFollowerRepo::delete);

        refreshFollowerCount(shop);

        return toStatus(shop, false);
    }

    @Override
    @Transactional(readOnly = true)
    public ShopFollowStatusResponse getFollowStatus(
            String email,
            Integer shopId
    ) {
        User user = findUser(email);
        Shop shop = findShop(shopId);

        return toStatus(
                shop,
                shopFollowerRepo.existsByShopAndUser(shop, user)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FollowingShopResponse> getMyFollowingShops(
            String email,
            int page,
            int size
    ) {
        User user = findUser(email);

        return shopFollowerRepo.findByUserOrderByCreatedAtDesc(
                user,
                PageRequest.of(
                        Math.max(page, 0),
                        Math.min(Math.max(size, 1), 50)
                )
        ).map(follower -> toFollowingShop(follower.getShop(), follower));
    }

    private void refreshFollowerCount(Shop shop) {
        long count = shopFollowerRepo.countByShop(shop);
        shop.setFollowerCount((int) count);
        shopRepo.save(shop);
    }

    private ShopFollowStatusResponse toStatus(
            Shop shop,
            boolean following
    ) {
        return ShopFollowStatusResponse.builder()
                .shopId(shop.getShopId())
                .following(following)
                .followerCount(shopFollowerRepo.countByShop(shop))
                .build();
    }

    private FollowingShopResponse toFollowingShop(
            Shop shop,
            ShopFollower follower
    ) {
        return FollowingShopResponse.builder()
                .shopId(shop.getShopId())
                .shopName(shop.getShopName())
                .shopSlug(shop.getShopSlug())
                .avatarUrl(shop.getAvatarUrl())
                .bannerUrl(shop.getBannerUrl())
                .description(shop.getDescription())
                .shopStatus(shop.getShopStatus() == null ? null : shop.getShopStatus().name())
                .rating(shop.getRating())
                .followerCount(shop.getFollowerCount())
                .followedAt(follower.getCreatedAt())
                .build();
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private Shop findShop(Integer shopId) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> AppException.notFound("Shop"));

        if (shop.getShopStatus() != Shop.Status.active) {
            throw new AppException(
                    "Shop hiện không hoạt động",
                    HttpStatus.BAD_REQUEST,
                    "SHOP_NOT_ACTIVE"
            );
        }

        return shop;
    }
}
