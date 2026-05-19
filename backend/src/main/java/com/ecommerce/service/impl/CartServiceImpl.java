package com.ecommerce.service.impl;

import com.ecommerce.dto.request.AddToCartRequest;
import com.ecommerce.dto.request.UpdateCartItemRequest;
import com.ecommerce.dto.response.CartItemResponse;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.dto.response.CartShopGroupResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ShoppingCartRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final UserRepository userRepository;
    private final ShoppingCartRepository shoppingCartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getMyCart(String email) {
        User user = getUser(email);
        ShoppingCart cart = getOrCreateCart(user);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItem(String email, AddToCartRequest request) {
        User user = getUser(email);
        ShoppingCart cart = getOrCreateCart(user);

        ProductVariant variant = productVariantRepository
                .findActiveVariantWithProduct(request.getVariantId())
                .orElseThrow(() -> AppException.notFound("Phân loại sản phẩm"));

        validateStock(variant, request.getQuantity());

        Optional<CartItem> existingItemOpt =
                cartItemRepository.findByCartCartIdAndVariantVariantId(
                        cart.getCartId(),
                        variant.getVariantId()
                );

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            int newQuantity = item.getQuantity() + request.getQuantity();

            validateStock(variant, newQuantity);

            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(request.getQuantity())
                    .build();

            cartItemRepository.save(item);
        }

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateItem(
            String email,
            Integer cartItemId,
            UpdateCartItemRequest request
    ) {
        User user = getUser(email);
        ShoppingCart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> AppException.notFound("Sản phẩm trong giỏ"));

        if (!Objects.equals(item.getCart().getCartId(), cart.getCartId())) {
            throw AppException.forbidden();
        }

        ProductVariant variant = item.getVariant();

        if (variant.getProduct().getProductStatus() != Product.Status.active) {
            throw badRequest("Sản phẩm này hiện không còn được bán", "PRODUCT_INACTIVE");
        }

        validateStock(variant, request.getQuantity());

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeItem(String email, Integer cartItemId) {
        User user = getUser(email);
        ShoppingCart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> AppException.notFound("Sản phẩm trong giỏ"));

        if (!Objects.equals(item.getCart().getCartId(), cart.getCartId())) {
            throw AppException.forbidden();
        }

        cartItemRepository.delete(item);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse clearCart(String email) {
        User user = getUser(email);
        ShoppingCart cart = getOrCreateCart(user);

        cartItemRepository.deleteByCartCartId(cart.getCartId());

        return buildCartResponse(cart);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Người dùng"));
    }

    private ShoppingCart getOrCreateCart(User user) {
        return shoppingCartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> shoppingCartRepository.save(
                        ShoppingCart.builder()
                                .user(user)
                                .build()
                ));
    }

    private void validateStock(ProductVariant variant, int quantity) {
        if (variant.getStockQuantity() == null || variant.getStockQuantity() <= 0) {
            throw badRequest("Sản phẩm đã hết hàng", "OUT_OF_STOCK");
        }

        if (quantity > variant.getStockQuantity()) {
            throw badRequest(
                    "Số lượng vượt quá tồn kho hiện có",
                    "QUANTITY_EXCEEDS_STOCK"
            );
        }
    }

    private CartResponse buildCartResponse(ShoppingCart cart) {
        List<CartItem> items = cartItemRepository.findItemsForCart(cart.getCartId());

        List<CartItemResponse> itemResponses = items.stream()
                .map(this::toItemResponse)
                .toList();

        Map<Integer, List<CartItemResponse>> groupedByShop = itemResponses.stream()
                .collect(Collectors.groupingBy(item -> {
                    CartItem original = items.stream()
                            .filter(ci -> Objects.equals(
                                    ci.getCartItemId(),
                                    item.getCartItemId()
                            ))
                            .findFirst()
                            .orElseThrow();

                    return original.getVariant()
                            .getProduct()
                            .getShop()
                            .getShopId();
                }, LinkedHashMap::new, Collectors.toList()));

        List<CartShopGroupResponse> shops = groupedByShop.entrySet()
                .stream()
                .map(entry -> {
                    Integer shopId = entry.getKey();
                    List<CartItemResponse> shopItems = entry.getValue();

                    CartItem firstOriginal = items.stream()
                            .filter(ci -> Objects.equals(
                                    ci.getVariant().getProduct().getShop().getShopId(),
                                    shopId
                            ))
                            .findFirst()
                            .orElseThrow();

                    Shop shop = firstOriginal.getVariant().getProduct().getShop();

                    BigDecimal subtotal = shopItems.stream()
                            .map(CartItemResponse::getItemTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    int totalQuantity = shopItems.stream()
                            .mapToInt(CartItemResponse::getQuantity)
                            .sum();

                    return CartShopGroupResponse.builder()
                            .shopId(shop.getShopId())
                            .shopName(shop.getShopName())
                            .shopSlug(shop.getShopSlug())
                            .items(shopItems)
                            .subtotal(subtotal)
                            .totalQuantity(totalQuantity)
                            .build();
                })
                .toList();

        BigDecimal totalAmount = itemResponses.stream()
                .map(CartItemResponse::getItemTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQuantity = itemResponses.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return CartResponse.builder()
                .cartId(cart.getCartId())
                .totalItems(itemResponses.size())
                .totalQuantity(totalQuantity)
                .totalAmount(totalAmount)
                .shops(shops)
                .build();
    }

    private CartItemResponse toItemResponse(CartItem item) {
        ProductVariant variant = item.getVariant();
        Product product = variant.getProduct();

        BigDecimal price = variant.getPrice();
        BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));

        return CartItemResponse.builder()
                .cartItemId(item.getCartItemId())

                .productId(product.getProductId())
                .productName(product.getProductName())
                .thumbnailUrl(product.getThumbnailUrl())
                .productStatus(product.getProductStatus().name())

                .variantId(variant.getVariantId())
                .variantName(variant.getVariantName())
                .sku(variant.getSku())
                .variantImageUrl(variant.getImageUrl())

                .price(price)
                .originalPrice(variant.getOriginalPrice())
                .discountPercent(variant.getDiscountPercent())

                .quantity(item.getQuantity())
                .stockQuantity(variant.getStockQuantity())

                .itemTotal(itemTotal)
                .build();
    }

    private AppException badRequest(String message, String errorCode) {
        return new AppException(message, HttpStatus.BAD_REQUEST, errorCode);
    }
}