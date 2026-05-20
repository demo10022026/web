package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.Shop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    Page<Product> findByProductStatusOrderByCreatedAtDesc(
            Product.Status status,
            Pageable pageable
    );

    Page<Product> findByProductStatusOrderBySoldCountDesc(
            Product.Status status,
            Pageable pageable
    );

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN p.shop s
        LEFT JOIN p.category c
        LEFT JOIN c.parentCategory pc
        LEFT JOIN p.brand b
        WHERE p.productStatus = 'active'
        AND (
            :keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(c.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(b.brandName) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (
            :parentCategoryId IS NULL
            OR c.categoryId = :parentCategoryId
            OR pc.categoryId = :parentCategoryId
        )
        AND (:categoryId IS NULL OR c.categoryId = :categoryId)
        AND (:brandId IS NULL OR b.brandId = :brandId)
        AND (
            :shopName IS NULL
            OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :shopName, '%'))
        )
        AND (
            :brandName IS NULL
            OR LOWER(b.brandName) LIKE LOWER(CONCAT('%', :brandName, '%'))
        )
        AND (
            :minPrice IS NULL
            OR (
                SELECT MIN(v.price)
                FROM ProductVariant v
                WHERE v.product = p
            ) >= :minPrice
        )
        AND (
            :maxPrice IS NULL
            OR (
                SELECT MIN(v.price)
                FROM ProductVariant v
                WHERE v.product = p
            ) <= :maxPrice
        )
        ORDER BY
            CASE WHEN :sort = 'bestseller' THEN p.soldCount END DESC,
            CASE WHEN :sort = 'price_asc' THEN (
                SELECT MIN(v1.price)
                FROM ProductVariant v1
                WHERE v1.product = p
            ) END ASC,
            CASE WHEN :sort = 'price_desc' THEN (
                SELECT MIN(v2.price)
                FROM ProductVariant v2
                WHERE v2.product = p
            ) END DESC,
            p.createdAt DESC
    """)
    Page<Product> searchProductsForUser(
            @Param("keyword") String keyword,
            @Param("parentCategoryId") Integer parentCategoryId,
            @Param("categoryId") Integer categoryId,
            @Param("brandId") Integer brandId,
            @Param("shopName") String shopName,
            @Param("brandName") String brandName,
            @Param("minPrice") Long minPrice,
            @Param("maxPrice") Long maxPrice,
            @Param("sort") String sort,
            Pageable pageable
    );

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.shop
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.brand
        WHERE p.productId = :id
        AND p.productStatus = 'active'
    """)
    Optional<Product> findActiveWithDetails(@Param("id") Integer id);

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN p.shop s
        LEFT JOIN p.category c
        LEFT JOIN p.brand b
        WHERE (:keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:status IS NULL OR p.productStatus = :status)
        AND (:shopId IS NULL OR s.shopId = :shopId)
        AND (:categoryId IS NULL OR c.categoryId = :categoryId)
        AND (:brandId IS NULL OR b.brandId = :brandId)
    """)
    Page<Product> adminSearchProducts(
            @Param("keyword") String keyword,
            @Param("status") Product.Status status,
            @Param("shopId") Integer shopId,
            @Param("categoryId") Integer categoryId,
            @Param("brandId") Integer brandId,
            Pageable pageable
    );

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.shop
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.brand
        WHERE p.productId = :productId
    """)
    Optional<Product> adminFindById(
            @Param("productId") Integer productId
    );

    long countByShop(Shop shop);

    long countByShopAndProductStatus(
            Shop shop,
            Product.Status productStatus
    );

    @Query("""
        SELECT COALESCE(SUM(p.soldCount), 0)
        FROM Product p
        WHERE p.shop = :shop
    """)
    Long sumSoldCountByShop(@Param("shop") Shop shop);

    @Query("""
        SELECT p
        FROM Product p
        WHERE p.shop = :shop
        ORDER BY p.createdAt DESC
    """)
    Page<Product> findRecentByShop(
            @Param("shop") Shop shop,
            Pageable pageable
    );

    Optional<Product> findByProductIdAndShop(
            Integer productId,
            Shop shop
    );

    @Query("""
        SELECT p
        FROM Product p
        LEFT JOIN p.category c
        LEFT JOIN p.brand b
        WHERE p.shop = :shop
        AND (
            :keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(c.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(b.brandName) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (:status IS NULL OR p.productStatus = :status)
        ORDER BY p.createdAt DESC
    """)
    Page<Product> searchSellerProducts(
            @Param("shop") Shop shop,
            @Param("keyword") String keyword,
            @Param("status") Product.Status status,
            Pageable pageable
    );
}