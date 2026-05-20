package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {

    List<ProductImage> findByProductOrderByImageIdAsc(Product product);

    Optional<ProductImage> findByImageIdAndProduct(
            Integer imageId,
            Product product
    );

    long countByProduct(Product product);
}
