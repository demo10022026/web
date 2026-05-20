package com.ecommerce.repository;

import com.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    Optional<CartItem> findByCartCartIdAndVariantVariantId(
            Integer cartId,
            Integer variantId
    );

    @Query("""
        SELECT ci FROM CartItem ci
        JOIN FETCH ci.variant v
        JOIN FETCH v.product p
        JOIN FETCH p.shop s
        WHERE ci.cart.cartId = :cartId
        ORDER BY ci.createdAt DESC
    """)
    List<CartItem> findItemsForCart(@Param("cartId") Integer cartId);

    @Query("""
        SELECT ci FROM CartItem ci
        JOIN FETCH ci.variant v
        JOIN FETCH v.product p
        JOIN FETCH p.shop s
        WHERE ci.cart.cartId = :cartId
        AND ci.cartItemId IN :cartItemIds
        ORDER BY ci.createdAt DESC
    """)
    List<CartItem> findCheckoutItems(
            @Param("cartId") Integer cartId,
            @Param("cartItemIds") Collection<Integer> cartItemIds
    );

    @Modifying
    void deleteByCartCartId(Integer cartId);
}
