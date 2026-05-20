package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.Shop;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository
        extends JpaRepository<ProductVariant, Integer> {

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

    Optional<ProductVariant> findByVariantIdAndProduct(
            Integer variantId,
            Product product
    );

    Optional<ProductVariant> findBySku(String sku);

    @Query("""
        SELECT COUNT(v)
        FROM ProductVariant v
        WHERE v.product.shop = :shop
        AND v.stockQuantity <= :threshold
    """)
    long countLowStockVariantsByShop(
            @Param("shop") Shop shop,
            @Param("threshold") int threshold
    );

    @Query("""
        SELECT v
        FROM ProductVariant v
        JOIN FETCH v.product p
        WHERE p.shop = :shop
        AND v.stockQuantity <= :threshold
        ORDER BY v.stockQuantity ASC
    """)
    List<ProductVariant> findLowStockVariantsByShop(
            @Param("shop") Shop shop,
            @Param("threshold") int threshold,
            Pageable pageable
    );
}
