package com.ecommerce.repository;

import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<SellerProfile, Integer> {

    Optional<SellerProfile> findByUser(User user);

    boolean existsByUser(User user);

    long countByVerificationStatus(SellerProfile.Status status);

    Page<SellerProfile> findByVerificationStatus(
            SellerProfile.Status verificationStatus,
            Pageable pageable
    );

    Page<SellerProfile> findByVerificationStatusOrderByCreatedAtDesc(
            SellerProfile.Status verificationStatus,
            Pageable pageable
    );

    @Query(
            value = """
                SELECT sp
                FROM SellerProfile sp
                JOIN FETCH sp.user u
                WHERE (:status IS NULL OR sp.verificationStatus = :status)
                AND (
                    :keyword IS NULL
                    OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(sp.identityNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(sp.taxCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                ORDER BY sp.createdAt DESC
            """,
            countQuery = """
                SELECT COUNT(sp)
                FROM SellerProfile sp
                JOIN sp.user u
                WHERE (:status IS NULL OR sp.verificationStatus = :status)
                AND (
                    :keyword IS NULL
                    OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(sp.identityNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(sp.taxCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
            """
    )
    Page<SellerProfile> searchSellers(
            @Param("status") SellerProfile.Status status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
        SELECT sp
        FROM SellerProfile sp
        JOIN FETCH sp.user u
        WHERE sp.sellerId = :sellerId
    """)
    Optional<SellerProfile> findDetailBySellerId(
            @Param("sellerId") Integer sellerId
    );
}
