package com.ecommerce.service.impl;

import com.ecommerce.dto.response.SellerAnalyticsResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.SellerAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerAnalyticsServiceImpl implements SellerAnalyticsService {

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;
    private final OrderItemRepository orderItemRepo;

    @Override
    @Transactional(readOnly = true)
    public SellerAnalyticsResponse getMyShopAnalytics(
            String email,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        Shop shop = findActiveShop(email);

        LocalDate resolvedToDate = toDate == null
                ? LocalDate.now()
                : toDate;

        LocalDate resolvedFromDate = fromDate == null
                ? resolvedToDate.minusDays(29)
                : fromDate;

        if (resolvedFromDate.isAfter(resolvedToDate)) {
            throw new AppException(
                    "Khoảng thời gian không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_DATE_RANGE"
            );
        }

        LocalDateTime startAt = resolvedFromDate.atStartOfDay();
        LocalDateTime endAt = resolvedToDate.plusDays(1).atStartOfDay();

        List<OrderItem> items = orderItemRepo.findSellerAnalyticsItems(
                shop,
                startAt,
                endAt
        );

        Map<Integer, Order> orderMap = items.stream()
                .map(OrderItem::getOrder)
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(
                        Order::getOrderId,
                        order -> order,
                        (first, second) -> first,
                        LinkedHashMap::new
                ));

        List<Order> orders = orderMap.values()
                .stream()
                .sorted(Comparator.comparing(
                        Order::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();

        List<OrderItem> deliveredItems = items.stream()
                .filter(item -> hasStatus(item, Order.OrderStatus.delivered))
                .toList();

        List<OrderItem> pendingItems = items.stream()
                .filter(item -> {
                    Order.OrderStatus status = getStatus(item);
                    return status == Order.OrderStatus.pending
                            || status == Order.OrderStatus.processing
                            || status == Order.OrderStatus.shipping;
                })
                .toList();

        List<OrderItem> validItems = items.stream()
                .filter(item -> {
                    Order.OrderStatus status = getStatus(item);
                    return status != Order.OrderStatus.cancelled
                            && status != Order.OrderStatus.returned;
                })
                .toList();

        BigDecimal revenue = sumLineTotal(deliveredItems);
        BigDecimal grossRevenue = sumLineTotal(validItems);
        BigDecimal pendingRevenue = sumLineTotal(pendingItems);
        BigDecimal cancelledRevenue = sumLineTotal(
                items.stream()
                        .filter(item -> hasStatus(item, Order.OrderStatus.cancelled))
                        .toList()
        );
        BigDecimal returnedRevenue = sumLineTotal(
                items.stream()
                        .filter(item -> hasStatus(item, Order.OrderStatus.returned))
                        .toList()
        );

        int orderCount = orders.size();
        int deliveredOrderCount = countOrdersByStatus(orders, Order.OrderStatus.delivered);
        int pendingOrderCount = orders.stream()
                .filter(order -> {
                    Order.OrderStatus status = order.getOrderStatus();
                    return status == Order.OrderStatus.pending
                            || status == Order.OrderStatus.processing
                            || status == Order.OrderStatus.shipping;
                })
                .collect(Collectors.toMap(
                        Order::getOrderId,
                        order -> order,
                        (first, second) -> first
                ))
                .size();

        int cancelledOrderCount = countOrdersByStatus(orders, Order.OrderStatus.cancelled);
        int returnedOrderCount = countOrdersByStatus(orders, Order.OrderStatus.returned);

        int soldQuantity = deliveredItems.stream()
                .mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                .sum();

        BigDecimal averageOrderValue = deliveredOrderCount == 0
                ? BigDecimal.ZERO
                : revenue.divide(
                        BigDecimal.valueOf(deliveredOrderCount),
                        0,
                        RoundingMode.HALF_UP
                );

        SellerAnalyticsResponse.Summary summary =
                SellerAnalyticsResponse.Summary.builder()
                        .revenue(revenue)
                        .grossRevenue(grossRevenue)
                        .pendingRevenue(pendingRevenue)
                        .cancelledRevenue(cancelledRevenue)
                        .returnedRevenue(returnedRevenue)

                        .orderCount(orderCount)
                        .deliveredOrderCount(deliveredOrderCount)
                        .pendingOrderCount(pendingOrderCount)
                        .cancelledOrderCount(cancelledOrderCount)
                        .returnedOrderCount(returnedOrderCount)

                        .soldQuantity(soldQuantity)
                        .averageOrderValue(averageOrderValue)

                        .completionRate(percent(deliveredOrderCount, orderCount))
                        .cancellationRate(percent(cancelledOrderCount, orderCount))
                        .returnRate(percent(returnedOrderCount, orderCount))
                        .build();

        return SellerAnalyticsResponse.builder()
                .fromDate(resolvedFromDate)
                .toDate(resolvedToDate)
                .summary(summary)
                .dailyRevenue(buildDailyRevenue(
                        resolvedFromDate,
                        resolvedToDate,
                        deliveredItems
                ))
                .statusStats(buildStatusStats(orders, items))
                .topProducts(buildTopProducts(deliveredItems))
                .recentOrders(buildRecentOrders(orders, items))
                .build();
    }

    private List<SellerAnalyticsResponse.DailyRevenue> buildDailyRevenue(
            LocalDate fromDate,
            LocalDate toDate,
            List<OrderItem> deliveredItems
    ) {
        Map<LocalDate, List<OrderItem>> itemsByDate = deliveredItems.stream()
                .filter(item -> item.getOrder() != null
                        && item.getOrder().getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        item -> item.getOrder().getCreatedAt().toLocalDate()
                ));

        List<SellerAnalyticsResponse.DailyRevenue> result = new ArrayList<>();

        LocalDate current = fromDate;

        while (!current.isAfter(toDate)) {
            List<OrderItem> dayItems = itemsByDate.getOrDefault(current, List.of());

            Set<Integer> orderIds = dayItems.stream()
                    .map(OrderItem::getOrder)
                    .filter(Objects::nonNull)
                    .map(Order::getOrderId)
                    .collect(Collectors.toSet());

            int quantity = dayItems.stream()
                    .mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                    .sum();

            result.add(
                    SellerAnalyticsResponse.DailyRevenue.builder()
                            .date(current)
                            .revenue(sumLineTotal(dayItems))
                            .orderCount(orderIds.size())
                            .soldQuantity(quantity)
                            .build()
            );

            current = current.plusDays(1);
        }

        return result;
    }

    private List<SellerAnalyticsResponse.StatusStat> buildStatusStats(
            List<Order> orders,
            List<OrderItem> items
    ) {
        List<Order.OrderStatus> statuses = List.of(
                Order.OrderStatus.pending,
                Order.OrderStatus.processing,
                Order.OrderStatus.shipping,
                Order.OrderStatus.delivered,
                Order.OrderStatus.cancelled,
                Order.OrderStatus.returned
        );

        return statuses.stream()
                .map(status -> {
                    Set<Integer> orderIds = orders.stream()
                            .filter(order -> order.getOrderStatus() == status)
                            .map(Order::getOrderId)
                            .collect(Collectors.toSet());

                    BigDecimal statusRevenue = sumLineTotal(
                            items.stream()
                                    .filter(item -> hasStatus(item, status))
                                    .toList()
                    );

                    return SellerAnalyticsResponse.StatusStat.builder()
                            .status(status.name())
                            .label(statusLabel(status))
                            .orderCount(orderIds.size())
                            .revenue(statusRevenue)
                            .build();
                })
                .toList();
    }

    private List<SellerAnalyticsResponse.TopProduct> buildTopProducts(
            List<OrderItem> deliveredItems
    ) {
        Map<Integer, List<OrderItem>> itemsByProductId = deliveredItems.stream()
                .filter(item -> item.getProduct() != null
                        && item.getProduct().getProductId() != null)
                .collect(Collectors.groupingBy(
                        item -> item.getProduct().getProductId()
                ));

        return itemsByProductId.entrySet()
                .stream()
                .map(entry -> {
                    List<OrderItem> productItems = entry.getValue();
                    Product product = productItems.get(0).getProduct();

                    int quantity = productItems.stream()
                            .mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                            .sum();

                    int orderCount = productItems.stream()
                            .map(OrderItem::getOrder)
                            .filter(Objects::nonNull)
                            .map(Order::getOrderId)
                            .collect(Collectors.toSet())
                            .size();

                    return SellerAnalyticsResponse.TopProduct.builder()
                            .productId(product.getProductId())
                            .productName(product.getProductName())
                            .thumbnailUrl(product.getThumbnailUrl())
                            .quantitySold(quantity)
                            .orderCount(orderCount)
                            .revenue(sumLineTotal(productItems))
                            .build();
                })
                .sorted(Comparator.comparing(
                        SellerAnalyticsResponse.TopProduct::getRevenue,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(10)
                .toList();
    }

    private List<SellerAnalyticsResponse.RecentOrder> buildRecentOrders(
            List<Order> orders,
            List<OrderItem> items
    ) {
        Map<Integer, List<OrderItem>> itemsByOrderId = items.stream()
                .filter(item -> item.getOrder() != null)
                .collect(Collectors.groupingBy(
                        item -> item.getOrder().getOrderId()
                ));

        return orders.stream()
                .sorted(Comparator.comparing(
                        Order::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(8)
                .map(order -> {
                    List<OrderItem> orderItems = itemsByOrderId
                            .getOrDefault(order.getOrderId(), List.of());

                    User customer = order.getUser();

                    return SellerAnalyticsResponse.RecentOrder.builder()
                            .orderId(order.getOrderId())
                            .orderCode(toOrderCode(order.getOrderId()))
                            .orderStatus(order.getOrderStatus() == null
                                    ? null
                                    : order.getOrderStatus().name())
                            .customerName(customer == null ? null : customer.getFullName())
                            .receiverName(order.getReceiverName())
                            .receiverPhone(order.getReceiverPhone())
                            .fullShippingAddress(buildFullShippingAddress(order))
                            .shopSubtotalAmount(sumLineTotal(orderItems))
                            .createdAt(order.getCreatedAt())
                            .build();
                })
                .toList();
    }

    private int countOrdersByStatus(
            List<Order> orders,
            Order.OrderStatus status
    ) {
        return (int) orders.stream()
                .filter(order -> order.getOrderStatus() == status)
                .map(Order::getOrderId)
                .distinct()
                .count();
    }

    private boolean hasStatus(
            OrderItem item,
            Order.OrderStatus status
    ) {
        return getStatus(item) == status;
    }

    private Order.OrderStatus getStatus(OrderItem item) {
        if (item == null || item.getOrder() == null) {
            return null;
        }

        return item.getOrder().getOrderStatus();
    }

    private BigDecimal sumLineTotal(List<OrderItem> items) {
        return items.stream()
                .map(this::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal lineTotal(OrderItem item) {
        BigDecimal price = safeMoney(item.getPrice());
        int quantity = item.getQuantity() == null ? 0 : item.getQuantity();

        return price.multiply(BigDecimal.valueOf(quantity));
    }

    private BigDecimal percent(int part, int total) {
        if (total <= 0) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(part)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
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

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String toOrderCode(Integer orderId) {
        if (orderId == null) {
            return "DH000000";
        }

        return "DH" + String.format("%06d", orderId);
    }

    private String statusLabel(Order.OrderStatus status) {
        if (status == null) {
            return "Không rõ";
        }

        return switch (status) {
            case pending -> "Chờ xác nhận";
            case processing -> "Đang chuẩn bị";
            case shipping -> "Đang giao";
            case delivered -> "Hoàn thành";
            case cancelled -> "Đã hủy";
            case returned -> "Trả hàng";
        };
    }

    private String buildFullShippingAddress(Order order) {
        List<String> parts = new ArrayList<>();

        addIfNotBlank(parts, order.getShippingAddress());
        addIfNotBlank(parts, order.getWardName());
        addIfNotBlank(parts, order.getDistrictName());
        addIfNotBlank(parts, order.getProvinceName());

        return String.join(", ", parts);
    }

    private void addIfNotBlank(
            List<String> parts,
            String value
    ) {
        if (value != null && !value.isBlank()) {
            parts.add(value.trim());
        }
    }
}
