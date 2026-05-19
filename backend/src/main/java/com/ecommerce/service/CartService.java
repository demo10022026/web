package com.ecommerce.service;

import com.ecommerce.dto.request.AddToCartRequest;
import com.ecommerce.dto.request.UpdateCartItemRequest;
import com.ecommerce.dto.response.CartResponse;

public interface CartService {

    CartResponse getMyCart(String email);

    CartResponse addItem(String email, AddToCartRequest request);

    CartResponse updateItem(String email, Integer cartItemId, UpdateCartItemRequest request);

    CartResponse removeItem(String email, Integer cartItemId);

    CartResponse clearCart(String email);
}