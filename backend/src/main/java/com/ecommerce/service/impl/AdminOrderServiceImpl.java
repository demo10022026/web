package com.ecommerce.service.impl;

import com.ecommerce.dto.request.AdminUpdateOrderStatusRequest;
import com.ecommerce.dto.response.AdminOrderResponse;
import com.ecommerce.dto.response.AdminOrderStatsResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.AdminOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrderServiceImpl implements AdminOrderService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final PaymentRepository paymentRepo;
    private final ProductRepository productRepo;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminOrderResponse> getOrders(
            String status,
            String keyword,
            int page,
            int size
    ) {
        Order.OrderStatus orderStatus = parseStatus(status);
        String cleanKeyword = normalizeText(keyword);
        Integer keywordOrderId = parseOrderId(cleanKeyword);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100)
        );

        Page<Order> orders = orderRepo.adminSearchOrders(
                orderStatus,
                cleanKeyword,
                keywordOrderId,
                pageable
        );

        if (orders.isEmpty()) {
            return orders.map(order -> toResponse(order, List.of(), null));
        }

        List<Order> orderList = orders.getContent();
        List<OrderItem> items = orderItemRepo.adminFindByOrderInWithRelations(orderList);
        Map<Integer, List<OrderItem>> itemsByOrderId = groupItemsByOrderId(items);
        Map<Integer, Payment> paymentByOrderId = findPaymentByOrderId(orderList);

        return orders.map(order -> toResponse(
                order,
                itemsByOrderId.getOrDefault(order.getOrderId(), List.of()),
                paymentByOrderId.get(order.getOrderId())
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderStatsResponse getStats() {
        return AdminOrderStatsResponse.builder()
                .totalOrders(orderRepo.count())
                .pendingOrders(orderRepo.countByOrderStatus(Order.OrderStatus.pending))
                .processingOrders(orderRepo.countByOrderStatus(Order.OrderStatus.processing))
                .shippingOrders(orderRepo.countByOrderStatus(Order.OrderStatus.shipping))
                .deliveredOrders(orderRepo.countByOrderStatus(Order.OrderStatus.delivered))
                .cancelledOrders(orderRepo.countByOrderStatus(Order.OrderStatus.cancelled))
                .returnedOrders(orderRepo.countByOrderStatus(Order.OrderStatus.returned))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderResponse getOrderDetail(Integer orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> AppException.notFound("Đơn hàng"));

        List<OrderItem> items = orderItemRepo.adminFindByOrderWithRelations(order);
        Payment payment = paymentRepo.findByOrder(order).orElse(null);

        return toResponse(order, items, payment);
    }

    @Override
    @Transactional
    public AdminOrderResponse updateOrderStatus(
            Integer orderId,
            AdminUpdateOrderStatusRequest request
    ) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> AppException.notFound("Đơn hàng"));

        if (request == null || request.getOrderStatus() == null) {
            throw new AppException(
                    "Trạng thái đơn hàng không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "ORDER_STATUS_REQUIRED"
            );
        }

        Order.OrderStatus previousStatus = order.getOrderStatus();
        Order.OrderStatus nextStatus = request.getOrderStatus();

        List<OrderItem> items = orderItemRepo.adminFindByOrderWithRelations(order);
        adjustSoldCountOnStatusChange(previousStatus, nextStatus, items);

        order.setOrderStatus(nextStatus);

        String trackingCode = normalizeText(request.getTrackingCode());
        if (trackingCode != null) {
            order.setTrackingCode(trackingCode);
        }

        String ghnOrderCode = normalizeText(request.getGhnOrderCode());
        if (ghnOrderCode != null) {
            order.setGhnOrderCode(ghnOrderCode);
        }

        Order saved = orderRepo.save(order);

        Payment payment = paymentRepo.findByOrder(saved).orElse(null);

        return toResponse(saved, items, payment);
    }

    private void adjustSoldCountOnStatusChange(
            Order.OrderStatus previousStatus,
            Order.OrderStatus nextStatus,
            List<OrderItem> items
    ) {
        if (previousStatus == nextStatus || items == null || items.isEmpty()) {
            return;
        }

        if (
                previousStatus != Order.OrderStatus.delivered
                        && nextStatus == Order.OrderStatus.delivered
        ) {
            applySoldCountDelta(items, 1);
            return;
        }

        if (
                previousStatus == Order.OrderStatus.delivered
                        && nextStatus != Order.OrderStatus.delivered
        ) {
            applySoldCountDelta(items, -1);
        }
    }

    private void applySoldCountDelta(
            List<OrderItem> items,
            int direction
    ) {
        for (OrderItem item : items) {
            Product product = item.getProduct();

            if (product == null) {
                continue;
            }

            int currentSoldCount = product.getSoldCount() == null
                    ? 0
                    : product.getSoldCount();

            int quantity = item.getQuantity() == null
                    ? 0
                    : item.getQuantity();

            int nextSoldCount = Math.max(
                    0,
                    currentSoldCount + direction * quantity
            );

            product.setSoldCount(nextSoldCount);
            productRepo.save(product);
        }
    }

    private AdminOrderResponse toResponse(
            Order order,
            List<OrderItem> items,
            Payment payment
    ) {
        User customer = order.getUser();
        ShippingProvider shippingProvider = order.getShippingProvider();

        BigDecimal subtotal = items.stream()
                .map(this::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<AdminOrderResponse.Item> itemResponses = items.stream()
                .map(this::toItemResponse)
                .toList();

        List<AdminOrderResponse.ShopGroup> shopGroups = items.stream()
                .filter(item -> item.getShop() != null)
                .collect(Collectors.groupingBy(item -> item.getShop().getShopId()))
                .values()
                .stream()
                .map(this::toShopGroup)
                .sorted(Comparator.comparing(group -> group.getShopName() == null ? "" : group.getShopName()))
                .toList();

        return AdminOrderResponse.builder()
                .orderId(order.getOrderId())
                .orderCode(toOrderCode(order.getOrderId()))
                .orderStatus(order.getOrderStatus() == null ? null : order.getOrderStatus().name())

                .customerId(customer == null ? null : customer.getUserId())
                .customerName(customer == null ? null : customer.getFullName())
                .customerEmail(customer == null ? null : customer.getEmail())
                .customerPhone(customer == null ? null : customer.getPhoneNumber())

                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .provinceName(order.getProvinceName())
                .districtName(order.getDistrictName())
                .wardName(order.getWardName())
                .shippingAddress(order.getShippingAddress())
                .fullShippingAddress(buildFullShippingAddress(order))

                .shippingProviderId(shippingProvider == null ? null : shippingProvider.getProviderId())
                .shippingProviderName(shippingProvider == null ? null : shippingProvider.getProviderName())
                .ghnOrderCode(order.getGhnOrderCode())
                .trackingCode(order.getTrackingCode())

                .subtotalAmount(subtotal)
                .shippingFee(safeMoney(order.getShippingFee()))
                .totalAmount(safeMoney(order.getTotalAmount()))

                .payment(toPaymentInfo(payment))
                .createdAt(order.getCreatedAt())
                .shops(shopGroups)
                .items(itemResponses)
                .build();
    }

    private AdminOrderResponse.ShopGroup toShopGroup(List<OrderItem> items) {
        OrderItem first = items.get(0);
        Shop shop = first.getShop();

        BigDecimal shopSubtotal = items.stream()
                .map(this::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminOrderResponse.ShopGroup.builder()
                .shopId(shop == null ? null : shop.getShopId())
                .shopName(shop == null ? null : shop.getShopName())
                .shopSlug(shop == null ? null : shop.getShopSlug())
                .shopSubtotal(shopSubtotal)
                .items(items.stream()
                        .map(this::toItemResponse)
                        .toList())
                .build();
    }

    private AdminOrderResponse.Item toItemResponse(OrderItem item) {
        Shop shop = item.getShop();
        Product product = item.getProduct();
        ProductVariant variant = item.getVariant();

        return AdminOrderResponse.Item.builder()
                .orderItemId(item.getOrderItemId())

                .shopId(shop == null ? null : shop.getShopId())
                .shopName(shop == null ? null : shop.getShopName())
                .shopSlug(shop == null ? null : shop.getShopSlug())

                .productId(product == null ? null : product.getProductId())
                .productName(product == null ? null : product.getProductName())
                .thumbnailUrl(product == null ? null : product.getThumbnailUrl())

                .variantId(variant == null ? null : variant.getVariantId())
                .variantName(variant == null ? null : variant.getVariantName())
                .sku(variant == null ? null : variant.getSku())

                .quantity(item.getQuantity())
                .price(safeMoney(item.getPrice()))
                .lineTotal(lineTotal(item))
                .build();
    }

    private AdminOrderResponse.PaymentInfo toPaymentInfo(Payment payment) {
        if (payment == null) {
            return null;
        }

        return AdminOrderResponse.PaymentInfo.builder()
                .paymentId(payment.getPaymentId())
                .paymentMethod(payment.getPaymentMethod() == null ? null : payment.getPaymentMethod().name())
                .paymentStatus(payment.getPaymentStatus() == null ? null : payment.getPaymentStatus().name())
                .transactionCode(payment.getTransactionCode())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    private Map<Integer, List<OrderItem>> groupItemsByOrderId(List<OrderItem> items) {
        return items.stream()
                .collect(Collectors.groupingBy(item -> item.getOrder().getOrderId()));
    }

    private Map<Integer, Payment> findPaymentByOrderId(Collection<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return Map.of();
        }

        return paymentRepo.findByOrderIn(orders)
                .stream()
                .filter(payment -> payment.getOrder() != null)
                .collect(Collectors.toMap(
                        payment -> payment.getOrder().getOrderId(),
                        payment -> payment,
                        (first, second) -> first
                ));
    }

    private Order.OrderStatus parseStatus(String status) {
        String clean = normalizeText(status);

        if (clean == null || clean.equals("all")) {
            return null;
        }

        try {
            return Order.OrderStatus.valueOf(clean);
        } catch (IllegalArgumentException e) {
            throw new AppException(
                    "Trạng thái đơn hàng không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ORDER_STATUS"
            );
        }
    }

    private Integer parseOrderId(String keyword) {
        if (keyword == null) {
            return null;
        }

        String clean = keyword.trim().toUpperCase();

        if (clean.startsWith("DH")) {
            clean = clean.substring(2);
        }

        try {
            return Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String buildFullShippingAddress(Order order) {
        return List.of(
                        order.getShippingAddress(),
                        order.getWardName(),
                        order.getDistrictName(),
                        order.getProvinceName()
                )
                .stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.joining(", "));
    }

    private BigDecimal lineTotal(OrderItem item) {
        return safeMoney(item.getPrice())
                .multiply(BigDecimal.valueOf(item.getQuantity() == null ? 0 : item.getQuantity()));
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private String toOrderCode(Integer orderId) {
        if (orderId == null) {
            return "DH000000";
        }

        return "DH" + String.format("%06d", orderId);
    }
}
