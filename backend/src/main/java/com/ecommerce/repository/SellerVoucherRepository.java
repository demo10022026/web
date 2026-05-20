package com.ecommerce.repository;

import com.ecommerce.entity.Shop;
import com.ecommerce.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SellerVoucherRepository extends JpaRepository<Voucher, Integer> {

    List<Voucher> findByShopOrderByCreatedAtDesc(Shop shop);

    Optional<Voucher> findByVoucherIdAndShop(
            Integer voucherId,
            Shop shop
    );

    Optional<Voucher> findByCode(String code);
}
