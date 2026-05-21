package com.ecommerce.repository;

import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.Review;
import com.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    boolean existsByOrderItem(OrderItem orderItem);

    Optional<Review> findByOrderItem(OrderItem orderItem);

    List<Review> findByOrderItemIn(Collection<OrderItem> orderItems);

    List<Review> findByUserOrderByCreatedAtDesc(User user);

    List<Review> findByProductOrderByCreatedAtDesc(Product product);

    Page<Review> findByProductOrderByCreatedAtDesc(
            Product product,
            Pageable pageable
    );

    Page<Review> findByProductAndRatingInOrderByCreatedAtDesc(
            Product product,
            Collection<Integer> ratings,
            Pageable pageable
    );

    long countByProduct(Product product);

    long countByProductAndRating(Product product, Integer rating);

    @Query("""
        SELECT AVG(r.rating)
        FROM Review r
        WHERE r.product = :product
    """)
    Double averageRatingByProduct(@Param("product") Product product);
}
