package com.ecommerce.repository;

import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Integer> {

    Optional<Shop> findBySeller(SellerProfile seller);

    List<Shop> findBySellerIn(Collection<SellerProfile> sellers);

    Optional<Shop> findByShopSlug(String shopSlug);

    boolean existsBySeller(SellerProfile seller);

    boolean existsByShopSlug(String shopSlug);

    long countByShopStatus(Shop.Status shopStatus);
}
