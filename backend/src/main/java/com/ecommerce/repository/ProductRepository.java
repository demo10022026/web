package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    /** Sản phẩm mới nhất đang active */
    Page<Product> findByProductStatusOrderByCreatedAtDesc(Product.Status status, Pageable pageable);

    /** Sản phẩm bán chạy nhất */
    Page<Product> findByProductStatusOrderBySoldCountDesc(Product.Status status, Pageable pageable);

    /** Tìm kiếm theo tên */
    @Query("""
        SELECT p FROM Product p
        WHERE p.productStatus = 'active'
        AND (LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.shop.shopName) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<Product> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /** Lọc theo category */
    @Query("""
        SELECT p FROM Product p
        WHERE p.productStatus = 'active'
        AND (:categoryId IS NULL OR p.category.categoryId = :categoryId)
        AND (:brandId IS NULL OR p.brand.brandId = :brandId)
        AND (:minPrice IS NULL OR (SELECT MIN(v.price) FROM ProductVariant v WHERE v.product = p) >= :minPrice)
        AND (:maxPrice IS NULL OR (SELECT MIN(v.price) FROM ProductVariant v WHERE v.product = p) <= :maxPrice)
        AND (:keyword IS NULL OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<Product> filterProducts(
        @Param("keyword")    String keyword,
        @Param("categoryId") Integer categoryId,
        @Param("brandId")    Integer brandId,
        @Param("minPrice")   Long minPrice,
        @Param("maxPrice")   Long maxPrice,
        Pageable pageable
    );

    /** Load chi tiết với variants và images */
    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.variants
        LEFT JOIN FETCH p.images
        LEFT JOIN FETCH p.shop
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.brand
        WHERE p.productId = :id AND p.productStatus = 'active'
        """)
    Optional<Product> findActiveWithDetails(@Param("id") Integer id);
}
