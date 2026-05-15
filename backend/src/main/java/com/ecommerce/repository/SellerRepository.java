package com.ecommerce.repository;

import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<SellerProfile, Integer> {
    Optional<SellerProfile> findByUser(User user);
    boolean existsByUser(User user);
    Page<SellerProfile> findByVerificationStatus(SellerProfile.Status status, Pageable pageable);
}
