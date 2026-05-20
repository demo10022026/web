package com.ecommerce.service.impl;

import com.ecommerce.dto.response.UserOrderResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.UserOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserOrderServiceImpl implements UserOrderService {

    private final UserRepository userRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;

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

        String cleanKeyword = normalizeText(keyword);

        return orders.stream()
                .map(order -> toResponse(
                        order,
                        itemsByOrderId.getOrDefault(
                                order.getOrderId(),
                                List.of()
                        )
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

        return toResponse(saved, items);
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
            List<OrderItem> items
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
                        .map(this::toItemResponse)
                        .toList())
                .build();
    }

    private UserOrderResponse.Item toItemResponse(OrderItem item) {
        Product product = item.getProduct();
        ProductVariant variant = item.getVariant();

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
                .build();
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