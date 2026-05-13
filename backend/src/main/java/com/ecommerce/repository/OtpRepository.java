package com.ecommerce.repository;

import com.ecommerce.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String email, OtpCode.Purpose purpose);

    @Modifying
    @Query("UPDATE OtpCode o SET o.used = true WHERE o.email = :email AND o.purpose = :purpose")
    void invalidateAllByEmailAndPurpose(String email, OtpCode.Purpose purpose);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.expiresAt < :now")
    void deleteExpired(LocalDateTime now);
}
