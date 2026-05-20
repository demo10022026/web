package com.ecommerce.repository;

import com.ecommerce.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    @Query("""
        SELECT v
        FROM Voucher v
        LEFT JOIN FETCH v.shop s
        WHERE v.voucherStatus = 'active'
        AND v.startTime <= :now
        AND v.endTime >= :now
        AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)
        ORDER BY v.endTime ASC, v.voucherId DESC
    """)
    List<Voucher> findActiveUsableVouchers(LocalDateTime now);

    @Query("""
        SELECT v
        FROM Voucher v
        LEFT JOIN FETCH v.shop s
        WHERE v.voucherStatus = 'active'
        AND v.startTime <= :now
        AND v.endTime >= :now
        AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)
        AND v.scope = :scope
        ORDER BY v.endTime ASC, v.voucherId DESC
    """)
    List<Voucher> findActiveUsableVouchersByScope(
            LocalDateTime now,
            Voucher.Scope scope
    );
}
