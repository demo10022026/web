package com.ecommerce.service.impl;

import com.ecommerce.dto.request.UpdateSellerOrderStatusRequest;
import com.ecommerce.dto.response.SellerOrderResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.*;
import com.ecommerce.service.SellerOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerOrderServiceImpl implements SellerOrderService {

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;

    @Override
    @Transactional(readOnly = true)
    public Page<SellerOrderResponse> getMyShopOrders(
            String email,
            String status,
            String keyword,
            int page,
            int size
    ) {
        Shop shop = findActiveShop(email);

        Order.OrderStatus orderStatus = parseStatus(status);
        String cleanKeyword = normalizeText(keyword);
        Integer keywordOrderId = parseOrderId(cleanKeyword);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50)
        );

        Page<Order> orders = orderRepo.searchSellerOrders(
                shop,
                orderStatus,
                cleanKeyword,
                keywordOrderId,
                pageable
        );

        if (orders.isEmpty()) {
            return orders.map(order -> toResponse(order, List.of(), shop));
        }

        List<OrderItem> items = orderItemRepo.findByOrderInAndShopWithProductVariant(
                orders.getContent(),
                shop
        );

        Map<Integer, List<OrderItem>> itemsByOrderId = items.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getOrder().getOrderId()
                ));

        return orders.map(order -> toResponse(
                order,
                itemsByOrderId.getOrDefault(order.getOrderId(), List.of()),
                shop
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public SellerOrderResponse getMyShopOrderDetail(
            String email,
            Integer orderId
    ) {
        Shop shop = findActiveShop(email);

        Order order = orderRepo.findSellerOrderById(shop, orderId)
                .orElseThrow(() -> AppException.notFound("Đơn hàng"));

        List<OrderItem> items = orderItemRepo.findByOrderAndShopWithProductVariant(
                order,
                shop
        );

        return toResponse(order, items, shop);
    }

    @Override
    @Transactional
    public SellerOrderResponse updateOrderStatus(
            String email,
            Integer orderId,
            UpdateSellerOrderStatusRequest request
    ) {
        Shop shop = findActiveShop(email);

        Order order = orderRepo.findSellerOrderById(shop, orderId)
                .orElseThrow(() -> AppException.notFound("Đơn hàng"));

        Order.OrderStatus nextStatus = request.getOrderStatus();

        validateStatusTransition(order.getOrderStatus(), nextStatus);

        order.setOrderStatus(nextStatus);

        Order saved = orderRepo.save(order);

        List<OrderItem> items = orderItemRepo.findByOrderAndShopWithProductVariant(
                saved,
                shop
        );

        return toResponse(saved, items, shop);
    }

    private void validateStatusTransition(
            Order.OrderStatus current,
            Order.OrderStatus next
    ) {
        if (current == null || next == null) {
            throw new AppException(
                    "Trạng thái đơn hàng không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ORDER_STATUS"
            );
        }

        boolean valid =
                (current == Order.OrderStatus.pending
                        && next == Order.OrderStatus.processing)
                        || (current == Order.OrderStatus.processing
                        && next == Order.OrderStatus.shipping)
                        || (current == Order.OrderStatus.shipping
                        && next == Order.OrderStatus.delivered);

        if (!valid) {
            throw new AppException(
                    "Không thể chuyển trạng thái đơn hàng từ "
                            + current.name()
                            + " sang "
                            + next.name(),
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ORDER_STATUS_TRANSITION"
            );
        }
    }

    private SellerOrderResponse toResponse(
            Order order,
            List<OrderItem> items,
            Shop shop
    ) {
        User customer = order.getUser();

        BigDecimal shopSubtotal = items.stream()
                .map(this::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return SellerOrderResponse.builder()
                .orderId(order.getOrderId())
                .orderCode(toOrderCode(order.getOrderId()))
                .orderStatus(order.getOrderStatus() == null
                        ? null
                        : order.getOrderStatus().name())

                .customerId(customer == null ? null : customer.getUserId())
                .customerName(customer == null ? null : customer.getFullName())
                .customerEmail(customer == null ? null : customer.getEmail())
                .customerPhone(customer == null ? null : customer.getPhoneNumber())

                .shopId(shop == null ? null : shop.getShopId())
                .shopName(shop == null ? null : shop.getShopName())

                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .provinceName(order.getProvinceName())
                .districtName(order.getDistrictName())
                .wardName(order.getWardName())
                .shippingAddress(order.getShippingAddress())
                .fullShippingAddress(buildFullShippingAddress(order))

                .ghnOrderCode(order.getGhnOrderCode())
                .trackingCode(order.getTrackingCode())

                .orderTotalAmount(safeMoney(order.getTotalAmount()))
                .shippingFee(safeMoney(order.getShippingFee()))
                .shopSubtotalAmount(shopSubtotal)

                .createdAt(order.getCreatedAt())

                .items(items.stream()
                        .map(this::toItemResponse)
                        .toList())
                .build();
    }

    private SellerOrderResponse.Item toItemResponse(OrderItem item) {
        Product product = item.getProduct();
        ProductVariant variant = item.getVariant();

        return SellerOrderResponse.Item.builder()
                .orderItemId(item.getOrderItemId())

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

    private BigDecimal lineTotal(OrderItem item) {
        BigDecimal price = safeMoney(item.getPrice());
        int quantity = item.getQuantity() == null ? 0 : item.getQuantity();

        return price.multiply(BigDecimal.valueOf(quantity));
    }

    private Shop findActiveShop(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));

        SellerProfile seller = sellerRepo.findByUser(user)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa đăng ký seller",
                        HttpStatus.FORBIDDEN,
                        "NOT_SELLER"
                ));

        if (seller.getVerificationStatus() != SellerProfile.Status.approved) {
            throw new AppException(
                    "Hồ sơ seller chưa được duyệt",
                    HttpStatus.FORBIDDEN,
                    "SELLER_NOT_APPROVED"
            );
        }

        Shop shop = shopRepo.findBySeller(seller)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa tạo shop",
                        HttpStatus.NOT_FOUND,
                        "SHOP_NOT_FOUND"
                ));

        if (shop.getShopStatus() != Shop.Status.active) {
            throw new AppException(
                    "Shop không ở trạng thái hoạt động",
                    HttpStatus.FORBIDDEN,
                    "SHOP_NOT_ACTIVE"
            );
        }

        return shop;
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

    private String buildFullShippingAddress(Order order) {
        return String.join(
                ", ",
                order.getShippingAddress(),
                order.getWardName(),
                order.getDistrictName(),
                order.getProvinceName()
        );
    }
}