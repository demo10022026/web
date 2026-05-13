package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "products")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Integer productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_status")
    @Builder.Default
    private Status productStatus = Status.draft;

    @Column(name = "sold_count")
    @Builder.Default
    private Integer soldCount = 0;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status { draft, active, inactive, banned }

    /** Lấy giá thấp nhất từ các variant */
    public BigDecimal getMinPrice() {
        return variants.stream()
            .filter(v -> v.getStockQuantity() > 0)
            .map(ProductVariant::getPrice)
            .min(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);
    }

    /** Lấy giá gốc thấp nhất */
    public BigDecimal getMinOriginalPrice() {
        return variants.stream()
            .filter(v -> v.getOriginalPrice() != null)
            .map(ProductVariant::getOriginalPrice)
            .min(BigDecimal::compareTo)
            .orElse(null);
    }

    /** % giảm giá cao nhất trong tất cả variant */
    public int getMaxDiscountPercent() {
        return variants.stream()
            .mapToInt(ProductVariant::getDiscountPercent)
            .max().orElse(0);
    }
}
