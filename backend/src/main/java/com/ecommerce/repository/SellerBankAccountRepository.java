package com.ecommerce.repository;

import com.ecommerce.entity.SellerBankAccount;
import com.ecommerce.entity.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SellerBankAccountRepository extends JpaRepository<SellerBankAccount, Integer> {

    List<SellerBankAccount> findBySellerOrderByIsPrimaryDescCreatedAtDesc(SellerProfile seller);

    Optional<SellerBankAccount> findFirstBySellerOrderByIsPrimaryDescCreatedAtDesc(SellerProfile seller);

    Optional<SellerBankAccount> findByBankAccountIdAndSeller(Integer bankAccountId, SellerProfile seller);

    @Modifying
    @Query("""
        UPDATE SellerBankAccount b
        SET b.isPrimary = false
        WHERE b.seller = :seller
    """)
    void clearPrimaryBySeller(@Param("seller") SellerProfile seller);
}
