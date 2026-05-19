package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {

    @Query("""
        SELECT v FROM ProductVariant v
        JOIN FETCH v.product p
        JOIN FETCH p.shop s
        WHERE v.variantId = :variantId
          AND p.productStatus = :status
    """)
    Optional<ProductVariant> findVariantWithProductByStatus(
            @Param("variantId") Integer variantId,
            @Param("status") Product.Status status
    );
}