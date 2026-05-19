package com.ecommerce.repository;

import com.ecommerce.entity.FlashSaleItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlashSaleRepository extends JpaRepository<FlashSaleItem, Integer> {

    @Modifying
    @Query("""
        DELETE FROM FlashSaleItem f
        WHERE f.product.productId = :productId
    """)
    void deleteByProductId(@Param("productId") Integer productId);

    @Query("""
        SELECT f FROM FlashSaleItem f
        JOIN FETCH f.product p
        LEFT JOIN FETCH p.variants
        WHERE f.isActive = true
        AND f.startTime <= :now AND f.endTime >= :now
        ORDER BY f.discountPercent DESC
        """)
    List<FlashSaleItem> findActiveFlashSales(LocalDateTime now, Pageable pageable);

    @Query("SELECT f.endTime FROM FlashSaleItem f WHERE f.isActive = true AND f.startTime <= :now AND f.endTime >= :now ORDER BY f.endTime ASC")
    List<java.time.LocalDateTime> findNextEndTime(LocalDateTime now, Pageable pageable);
}
