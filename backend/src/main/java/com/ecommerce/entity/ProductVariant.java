package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "product_variants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "variant_id")
    private Integer variantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(unique = true, length = 100)
    private String sku;

    @Column(name = "variant_name", length = 255)
    private String variantName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /** Giá gốc — dùng để tính % giảm giá */
    @Column(name = "original_price", precision = 12, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "stock_quantity")
    @Builder.Default
    private Integer stockQuantity = 0;

    @Builder.Default private Integer weight = 0;
    @Builder.Default private Integer length = 0;
    @Builder.Default private Integer width  = 0;
    @Builder.Default private Integer height = 0;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** Tính % giảm giá */
    public int getDiscountPercent() {
        if (originalPrice == null || originalPrice.compareTo(BigDecimal.ZERO) == 0) return 0;
        return (int) Math.round(
            (1.0 - price.doubleValue() / originalPrice.doubleValue()) * 100);
    }
}
