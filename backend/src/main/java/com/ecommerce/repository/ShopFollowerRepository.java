package com.ecommerce.repository;

import com.ecommerce.entity.Shop;
import com.ecommerce.entity.ShopFollower;
import com.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShopFollowerRepository extends JpaRepository<ShopFollower, Integer> {

    boolean existsByShopAndUser(Shop shop, User user);

    Optional<ShopFollower> findByShopAndUser(Shop shop, User user);

    long countByShop(Shop shop);

    Page<ShopFollower> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query("""
        SELECT sf.user
        FROM ShopFollower sf
        WHERE sf.shop = :shop
    """)
    List<User> findFollowerUsersByShop(@Param("shop") Shop shop);
}
