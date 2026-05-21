package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CreateReviewRequest;
import com.ecommerce.dto.response.BuyAgainResponse;
import com.ecommerce.dto.response.UserOrderResponse;
import com.ecommerce.dto.response.UserReviewResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.*;
import com.ecommerce.service.UserOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserOrderServiceImpl implements UserOrderService {

    private final UserRepository userRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final ReviewRepository reviewRepo;
    private final ProductRepository productRepo;
    private final ShoppingCartRepository shoppingCartRepo;
    private final CartItemRepository cartItemRepo;

    @Override
    @Transactional(readOnly = true)
    public List<UserOrderResponse> getMyOrders(
            String email,
            String status,
            String keyword
    ) {
        User user = findUser(email);

        Order.OrderStatus orderStatus = parseStatus(status);

        List<Order> orders = orderStatus == null
                ? orderRepo.findByUserOrderByCreatedAtDesc(user)
                : orderRepo.findByUserAndOrderStatusOrderByCreatedAtDesc(
                user,
                orderStatus
        );

        if (orders.isEmpty()) {
            return List.of();
        }

        List<OrderItem> allItems = orderItemRepo.findByOrderIn(orders);

        Map<Integer, List<OrderItem>> itemsByOrderId = allItems.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getOrder().getOrderId()
                ));

        Map<Integer, Review> reviewsByOrderItemId = reviewRepo
                .findByOrderItemIn(allItems)
                .stream()
                .collect(Collectors.toMap(
                        review -> review.getOrderItem().getOrderItemId(),
                        review -> review
                ));

        String cleanKeyword = normalizeText(keyword);

        return orders.stream()
                .map(order -> toResponse(
                        order,
                        itemsByOrderId.getOrDefault(
                                order.getOrderId(),
                                List.of()
                        ),
                        reviewsByOrderItemId
                ))
                .filter(order -> matchKeyword(order, cleanKeyword))
                .toList();
    }

    @Override
    @Transactional
    public UserOrderResponse cancelOrder(
            String email,
            Integer orderId
    ) {
        User user = findUser(email);

        Order order = orderRepo.findByOrderIdAndUser(orderId, user)
                .orElseThrow(() -> AppException.notFound("Đơn hàng"));

        if (!canCancel(order.getOrderStatus())) {
            throw new AppException(
                    "Đơn hàng hiện không thể hủy",
                    HttpStatus.BAD_REQUEST,
                    "ORDER_CANNOT_CANCEL"
            );
        }

        order.setOrderStatus(Order.OrderStatus.cancelled);

        Order saved = orderRepo.save(order);

        List<OrderItem> items = orderItemRepo.findByOrder(saved);

        Map<Integer, Review> reviewsByOrderItemId = reviewRepo
                .findByOrderItemIn(items)
                .stream()
                .collect(Collectors.toMap(
                        review -> review.getOrderItem().getOrderItemId(),
                        review -> review
                ));

        return toResponse(saved, items, reviewsByOrderItemId);
    }

    @Override
    @Transactional
    public UserReviewResponse createReview(
            String email,
            Integer orderItemId,
            CreateReviewRequest request
    ) {
        User user = findUser(email);

        OrderItem orderItem = orderItemRepo.findById(orderItemId)
                .orElseThrow(() -> AppException.notFound("Sản phẩm trong đơn hàng"));

        Order order = orderItem.getOrder();

        if (order == null || order.getUser() == null
                || !order.getUser().getUserId().equals(user.getUserId())) {
            throw new AppException(
                    "Bạn không có quyền đánh giá sản phẩm này",
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN_REVIEW"
            );
        }

        if (order.getOrderStatus() != Order.OrderStatus.delivered) {
            throw new AppException(
                    "Chỉ có thể đánh giá sản phẩm sau khi đơn hàng hoàn thành",
                    HttpStatus.BAD_REQUEST,
                    "ORDER_NOT_DELIVERED"
            );
        }

        if (reviewRepo.existsByOrderItem(orderItem)) {
            throw new AppException(
                    "Sản phẩm trong đơn hàng này đã được đánh giá",
                    HttpStatus.BAD_REQUEST,
                    "ORDER_ITEM_ALREADY_REVIEWED"
            );
        }

        Product product = orderItem.getProduct();

        if (product == null) {
            throw new AppException(
                    "Sản phẩm không tồn tại",
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_NOT_FOUND"
            );
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .orderItem(orderItem)
                .rating(request.getRating())
                .reviewContent(normalizeContent(request.getReviewContent()))
                .build();

        Review saved = reviewRepo.save(review);

        refreshProductRating(product);

        return toReviewResponse(saved);
    }

    @Override
    @Transactional
    public BuyAgainResponse buyAgain(
            String email,
            Integer orderId
    ) {
        User user = findUser(email);

        Order order = orderRepo.findByOrderIdAndUser(orderId, user)
                .orElseThrow(() -> AppException.notFound("Đơn hàng"));

        List<OrderItem> items = orderItemRepo.findByOrder(order);

        if (items.isEmpty()) {
            throw new AppException(
                    "Đơn hàng không có sản phẩm để mua lại",
                    HttpStatus.BAD_REQUEST,
                    "ORDER_EMPTY"
            );
        }

        ShoppingCart cart = shoppingCartRepo.findByUserUserId(user.getUserId())
                .orElseGet(() -> shoppingCartRepo.save(
                        ShoppingCart.builder()
                                .user(user)
                                .build()
                ));

        List<Integer> cartItemIds = new ArrayList<>();
        List<BuyAgainResponse.SkippedItem> skippedItems = new ArrayList<>();

        for (OrderItem item : items) {
            Product product = item.getProduct();
            ProductVariant variant = item.getVariant();

            if (product == null || variant == null) {
                skippedItems.add(toSkippedItem(
                        item,
                        "Sản phẩm hoặc biến thể không còn tồn tại"
                ));
                continue;
            }

            if (product.getProductStatus() != Product.Status.active) {
                skippedItems.add(toSkippedItem(
                        item,
                        "Sản phẩm hiện không còn được bán"
                ));
                continue;
            }

            int stock = variant.getStockQuantity() == null
                    ? 0
                    : variant.getStockQuantity();

            if (stock <= 0) {
                skippedItems.add(toSkippedItem(
                        item,
                        "Sản phẩm đã hết hàng"
                ));
                continue;
            }

            int oldQuantity = item.getQuantity() == null ? 1 : item.getQuantity();
            int quantityToAdd = Math.max(1, Math.min(oldQuantity, stock));

            CartItem cartItem = cartItemRepo
                    .findByCartCartIdAndVariantVariantId(
                            cart.getCartId(),
                            variant.getVariantId()
                    )
                    .map(existing -> {
                        int currentQuantity = existing.getQuantity() == null
                                ? 0
                                : existing.getQuantity();

                        int nextQuantity = Math.min(stock, currentQuantity + quantityToAdd);

                        existing.setQuantity(nextQuantity);

                        return existing;
                    })
                    .orElseGet(() -> CartItem.builder()
                            .cart(cart)
                            .variant(variant)
                            .quantity(quantityToAdd)
                            .build());

            CartItem saved = cartItemRepo.save(cartItem);

            cartItemIds.add(saved.getCartItemId());
        }

        if (cartItemIds.isEmpty()) {
            throw new AppException(
                    "Không có sản phẩm nào có thể mua lại",
                    HttpStatus.BAD_REQUEST,
                    "NO_ITEM_CAN_BUY_AGAIN"
            );
        }

        return BuyAgainResponse.builder()
                .cartItemIds(cartItemIds)
                .skippedItems(skippedItems)
                .build();
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private boolean canCancel(Order.OrderStatus status) {
        return status == Order.OrderStatus.pending
                || status == Order.OrderStatus.processing;
    }

    private Order.OrderStatus parseStatus(String status) {
        String cleanStatus = normalizeText(status);

        if (cleanStatus == null || cleanStatus.equals("all")) {
            return null;
        }

        try {
            return Order.OrderStatus.valueOf(cleanStatus);
        } catch (IllegalArgumentException e) {
            throw new AppException(
                    "Trạng thái đơn hàng không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ORDER_STATUS"
            );
        }
    }

    private UserOrderResponse toResponse(
            Order order,
            List<OrderItem> items,
            Map<Integer, Review> reviewsByOrderItemId
    ) {
        OrderItem firstItem = items.isEmpty() ? null : items.get(0);
        Shop shop = firstItem == null ? null : firstItem.getShop();

        BigDecimal subtotalAmount = items.stream()
                .map(item -> safeMoney(item.getPrice())
                        .multiply(BigDecimal.valueOf(
                                item.getQuantity() == null
                                        ? 0
                                        : item.getQuantity()
                        )))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return UserOrderResponse.builder()
                .orderId(order.getOrderId())
                .orderCode(toOrderCode(order.getOrderId()))
                .orderStatus(order.getOrderStatus() == null
                        ? null
                        : order.getOrderStatus().name())

                .shopId(shop == null ? null : shop.getShopId())
                .shopName(shop == null ? null : shop.getShopName())
                .shopSlug(shop == null ? null : shop.getShopSlug())

                .subtotalAmount(subtotalAmount)
                .shippingFee(safeMoney(order.getShippingFee()))
                .totalAmount(safeMoney(order.getTotalAmount()))

                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .provinceName(order.getProvinceName())
                .districtName(order.getDistrictName())
                .wardName(order.getWardName())
                .shippingAddress(order.getShippingAddress())

                .ghnOrderCode(order.getGhnOrderCode())
                .trackingCode(order.getTrackingCode())

                .createdAt(order.getCreatedAt())

                .items(items.stream()
                        .map(item -> toItemResponse(item, reviewsByOrderItemId))
                        .toList())
                .build();
    }

    private UserOrderResponse.Item toItemResponse(
            OrderItem item,
            Map<Integer, Review> reviewsByOrderItemId
    ) {
        Product product = item.getProduct();
        ProductVariant variant = item.getVariant();
        Review review = reviewsByOrderItemId.get(item.getOrderItemId());

        return UserOrderResponse.Item.builder()
                .orderItemId(item.getOrderItemId())

                .productId(product == null ? null : product.getProductId())
                .productName(product == null ? null : product.getProductName())
                .thumbnailUrl(product == null ? null : product.getThumbnailUrl())

                .variantId(variant == null ? null : variant.getVariantId())
                .variantName(variant == null ? null : variant.getVariantName())
                .sku(variant == null ? null : variant.getSku())

                .quantity(item.getQuantity())
                .price(item.getPrice())
                .originalPrice(variant == null ? null : variant.getOriginalPrice())

                .reviewed(review != null)
                .reviewId(review == null ? null : review.getReviewId())
                .build();
    }

    private BuyAgainResponse.SkippedItem toSkippedItem(
            OrderItem item,
            String reason
    ) {
        Product product = item.getProduct();
        ProductVariant variant = item.getVariant();

        return BuyAgainResponse.SkippedItem.builder()
                .productId(product == null ? null : product.getProductId())
                .productName(product == null ? null : product.getProductName())
                .variantId(variant == null ? null : variant.getVariantId())
                .variantName(variant == null ? null : variant.getVariantName())
                .reason(reason)
                .build();
    }

    private UserReviewResponse toReviewResponse(Review review) {
        Product product = review.getProduct();

        return UserReviewResponse.builder()
                .reviewId(review.getReviewId())
                .orderItemId(review.getOrderItem().getOrderItemId())
                .productId(product == null ? null : product.getProductId())
                .productName(product == null ? null : product.getProductName())
                .rating(review.getRating())
                .reviewContent(review.getReviewContent())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private void refreshProductRating(Product product) {
        Double averageRating = reviewRepo.averageRatingByProduct(product);

        BigDecimal rating = averageRating == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(averageRating).setScale(2, RoundingMode.HALF_UP);

        product.setAverageRating(rating);

        productRepo.save(product);
    }

    private boolean matchKeyword(
            UserOrderResponse order,
            String keyword
    ) {
        if (keyword == null) {
            return true;
        }

        if (contains(order.getOrderCode(), keyword)) {
            return true;
        }

        if (contains(order.getShopName(), keyword)) {
            return true;
        }

        if (String.valueOf(order.getOrderId()).contains(keyword)) {
            return true;
        }

        return order.getItems() != null
                && order.getItems()
                .stream()
                .anyMatch(item ->
                        contains(item.getProductName(), keyword)
                                || contains(item.getVariantName(), keyword)
                                || contains(item.getSku(), keyword)
                );
    }

    private boolean contains(String source, String keyword) {
        if (source == null || keyword == null) {
            return false;
        }

        return source.toLowerCase().contains(keyword.toLowerCase());
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeContent(String value) {
        String normalized = normalizeText(value);

        return normalized == null ? null : normalized;
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String toOrderCode(Integer orderId) {
        if (orderId == null) {
            return "DH000000";
        }

        return "DH" + String.format("%06d", orderId);
    }
}
