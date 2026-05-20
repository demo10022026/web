package com.ecommerce.repository;

import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShopRepository extends JpaRepository<Shop, Integer> {

    Optional<Shop> findBySeller(SellerProfile seller);

    boolean existsBySeller(SellerProfile seller);

    boolean existsByShopSlug(String shopSlug);
}