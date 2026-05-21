package com.ecommerce.repository;

import com.ecommerce.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    @Query("""
        SELECT v
        FROM Voucher v
        LEFT JOIN FETCH v.shop s
        WHERE v.voucherStatus = :activeStatus
        AND (v.startTime IS NULL OR v.startTime <= :now)
        AND (v.endTime IS NULL OR v.endTime >= :now)
        AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)
        ORDER BY v.endTime ASC, v.voucherId DESC
    """)
    List<Voucher> findActiveUsableVouchers(
            @Param("now") LocalDateTime now,
            @Param("activeStatus") Voucher.VoucherStatus activeStatus
    );

    /**
     * Method giữ tương thích với code cũ nếu nơi khác đang gọi 1 tham số.
     */
    default List<Voucher> findActiveUsableVouchers(LocalDateTime now) {
        return findActiveUsableVouchers(now, Voucher.VoucherStatus.active);
    }

    @Query("""
        SELECT v
        FROM Voucher v
        LEFT JOIN FETCH v.shop s
        WHERE v.voucherStatus = :activeStatus
        AND (v.startTime IS NULL OR v.startTime <= :now)
        AND (v.endTime IS NULL OR v.endTime >= :now)
        AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)
        AND v.scope = :scope
        ORDER BY v.endTime ASC, v.voucherId DESC
    """)
    List<Voucher> findActiveUsableVouchersByScope(
            @Param("now") LocalDateTime now,
            @Param("scope") Voucher.Scope scope,
            @Param("activeStatus") Voucher.VoucherStatus activeStatus
    );

    /**
     * Method giữ tương thích với code cũ nếu nơi khác đang gọi 2 tham số.
     */
    default List<Voucher> findActiveUsableVouchersByScope(
            LocalDateTime now,
            Voucher.Scope scope
    ) {
        return findActiveUsableVouchersByScope(
                now,
                scope,
                Voucher.VoucherStatus.active
        );
    }

    @Query(
            value = """
                SELECT v
                FROM Voucher v
                LEFT JOIN v.shop s
                WHERE (:scope IS NULL OR v.scope = :scope)
                AND (
                    :keyword IS NULL
                    OR LOWER(v.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.voucherName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                AND (
                    :status IS NULL
                    OR (:status = 'inactive' AND v.voucherStatus = :inactiveStatus)
                    OR (
                        :status = 'upcoming'
                        AND v.voucherStatus = :activeStatus
                        AND v.startTime IS NOT NULL
                        AND v.startTime > :now
                    )
                    OR (
                        :status = 'expired'
                        AND v.voucherStatus = :activeStatus
                        AND v.endTime IS NOT NULL
                        AND v.endTime < :now
                    )
                    OR (
                        :status = 'used_out'
                        AND v.voucherStatus = :activeStatus
                        AND v.usageLimit IS NOT NULL
                        AND v.usedCount >= v.usageLimit
                    )
                    OR (
                        :status = 'active'
                        AND v.voucherStatus = :activeStatus
                        AND (v.startTime IS NULL OR v.startTime <= :now)
                        AND (v.endTime IS NULL OR v.endTime >= :now)
                        AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)
                    )
                )
                ORDER BY v.createdAt DESC, v.voucherId DESC
            """,
            countQuery = """
                SELECT COUNT(v)
                FROM Voucher v
                LEFT JOIN v.shop s
                WHERE (:scope IS NULL OR v.scope = :scope)
                AND (
                    :keyword IS NULL
                    OR LOWER(v.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(v.voucherName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                AND (
                    :status IS NULL
                    OR (:status = 'inactive' AND v.voucherStatus = :inactiveStatus)
                    OR (
                        :status = 'upcoming'
                        AND v.voucherStatus = :activeStatus
                        AND v.startTime IS NOT NULL
                        AND v.startTime > :now
                    )
                    OR (
                        :status = 'expired'
                        AND v.voucherStatus = :activeStatus
                        AND v.endTime IS NOT NULL
                        AND v.endTime < :now
                    )
                    OR (
                        :status = 'used_out'
                        AND v.voucherStatus = :activeStatus
                        AND v.usageLimit IS NOT NULL
                        AND v.usedCount >= v.usageLimit
                    )
                    OR (
                        :status = 'active'
                        AND v.voucherStatus = :activeStatus
                        AND (v.startTime IS NULL OR v.startTime <= :now)
                        AND (v.endTime IS NULL OR v.endTime >= :now)
                        AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)
                    )
                )
            """
    )
    Page<Voucher> adminSearchVouchers(
            @Param("scope") Voucher.Scope scope,
            @Param("status") String status,
            @Param("keyword") String keyword,
            @Param("now") LocalDateTime now,
            @Param("activeStatus") Voucher.VoucherStatus activeStatus,
            @Param("inactiveStatus") Voucher.VoucherStatus inactiveStatus,
            Pageable pageable
    );
}
