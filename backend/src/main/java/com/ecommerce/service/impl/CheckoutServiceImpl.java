package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CheckoutRequest;
import com.ecommerce.dto.response.CheckoutPlaceOrderResponse;
import com.ecommerce.dto.response.CheckoutSummaryResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.*;
import com.ecommerce.service.CheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CheckoutServiceImpl implements CheckoutService {

    private static final BigDecimal DEFAULT_SHIPPING_FEE = BigDecimal.valueOf(30000);

    private final UserRepository userRepo;
    private final ShoppingCartRepository cartRepo;
    private final CartItemRepository cartItemRepo;
    private final ProductVariantRepository variantRepo;
    private final UserAddressRepository addressRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final VoucherRepository voucherRepo;
    private final UserVoucherRepository userVoucherRepo;

    @Override
    @Transactional(readOnly = true)
    public CheckoutSummaryResponse getSummary(
            String email,
            CheckoutRequest request
    ) {
        User user = findUser(email);
        List<CartItem> items = getCheckoutItems(user, request.getCartItemIds());
        validateItems(items);

        Voucher voucher = null;
        if (request.getVoucherId() != null) {
            voucher = voucherRepo.findById(request.getVoucherId())
                    .orElseThrow(() -> AppException.notFound("Voucher"));
            validateVoucher(user, voucher, items);
        }

        return buildSummary(items, voucher);
    }

    @Override
    @Transactional
    public CheckoutPlaceOrderResponse placeOrder(
            String email,
            CheckoutRequest request
    ) {
        User user = findUser(email);

        if (request.getAddressId() == null) {
            throw new AppException(
                    "Vui lòng chọn địa chỉ nhận hàng",
                    HttpStatus.BAD_REQUEST,
                    "ADDRESS_REQUIRED"
            );
        }

        UserAddress address = addressRepo.findByAddressIdAndUser(
                        request.getAddressId(),
                        user
                )
                .orElseThrow(() -> AppException.notFound("Địa chỉ"));

        List<CartItem> items = getCheckoutItems(user, request.getCartItemIds());
        validateItems(items);

        Voucher voucher = null;
        if (request.getVoucherId() != null) {
            voucher = voucherRepo.findById(request.getVoucherId())
                    .orElseThrow(() -> AppException.notFound("Voucher"));
            validateVoucher(user, voucher, items);
        }

        CheckoutSummaryResponse summary = buildSummary(items, voucher);

        Order order = Order.builder()
                .user(user)
                .orderStatus(Order.OrderStatus.pending)
                .totalAmount(summary.getTotalAmount())
                .shippingFee(summary.getShippingFee())
                .receiverName(address.getReceiverName())
                .receiverPhone(address.getReceiverPhone())
                .provinceName(address.getProvinceName())
                .districtName(address.getDistrictName())
                .wardName(address.getWardName())
                .shippingAddress(address.getAddressLine())
                .build();

        Order savedOrder = orderRepo.save(order);

        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : items) {
            ProductVariant variant = cartItem.getVariant();
            Product product = variant.getProduct();

            int nextStock = safeInt(variant.getStockQuantity()) - safeInt(cartItem.getQuantity());
            if (nextStock < 0) {
                throw new AppException(
                        "Sản phẩm " + product.getProductName() + " không đủ tồn kho",
                        HttpStatus.BAD_REQUEST,
                        "OUT_OF_STOCK"
                );
            }

            variant.setStockQuantity(nextStock);
            variantRepo.save(variant);

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .shop(product.getShop())
                    .product(product)
                    .variant(variant)
                    .quantity(cartItem.getQuantity())
                    .price(variant.getPrice())
                    .build();

            orderItems.add(orderItem);
        }

        orderItemRepo.saveAll(orderItems);

        if (voucher != null) {
            applyVoucherUsage(user, voucher);
        }

        cartItemRepo.deleteAll(items);

        return CheckoutPlaceOrderResponse.builder()
                .orderId(savedOrder.getOrderId())
                .orderCode(toOrderCode(savedOrder.getOrderId()))
                .totalAmount(summary.getTotalAmount())
                .orderStatus(savedOrder.getOrderStatus().name())
                .build();
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private List<CartItem> getCheckoutItems(
            User user,
            List<Integer> cartItemIds
    ) {
        if (cartItemIds == null || cartItemIds.isEmpty()) {
            throw new AppException(
                    "Vui lòng chọn sản phẩm cần thanh toán",
                    HttpStatus.BAD_REQUEST,
                    "CHECKOUT_ITEMS_REQUIRED"
            );
        }

        ShoppingCart cart = cartRepo.findByUserUserId(user.getUserId())
                .orElseThrow(() -> AppException.notFound("Giỏ hàng"));

        List<Integer> uniqueIds = cartItemIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (uniqueIds.isEmpty()) {
            throw new AppException(
                    "Vui lòng chọn sản phẩm cần thanh toán",
                    HttpStatus.BAD_REQUEST,
                    "CHECKOUT_ITEMS_REQUIRED"
            );
        }

        List<CartItem> items = cartItemRepo.findCheckoutItems(
                cart.getCartId(),
                uniqueIds
        );

        if (items.size() != uniqueIds.size()) {
            throw new AppException(
                    "Một số sản phẩm không còn trong giỏ hàng",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_CART_ITEMS"
            );
        }

        return items;
    }

    private void validateItems(List<CartItem> items) {
        for (CartItem item : items) {
            ProductVariant variant = item.getVariant();
            Product product = variant == null ? null : variant.getProduct();

            if (variant == null || product == null) {
                throw new AppException(
                        "Sản phẩm trong giỏ hàng không hợp lệ",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_CART_ITEM"
                );
            }

            if (product.getProductStatus() != Product.Status.active) {
                throw new AppException(
                        "Sản phẩm " + product.getProductName() + " hiện không còn bán",
                        HttpStatus.BAD_REQUEST,
                        "PRODUCT_NOT_ACTIVE"
                );
            }

            if (variant.getPrice() == null || variant.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(
                        "Giá sản phẩm không hợp lệ",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_PRODUCT_PRICE"
                );
            }

            int quantity = safeInt(item.getQuantity());

            if (quantity <= 0) {
                throw new AppException(
                        "Số lượng sản phẩm không hợp lệ",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_QUANTITY"
                );
            }

            if (safeInt(variant.getStockQuantity()) < quantity) {
                throw new AppException(
                        "Sản phẩm " + product.getProductName() + " không đủ tồn kho",
                        HttpStatus.BAD_REQUEST,
                        "OUT_OF_STOCK"
                );
            }
        }
    }

    private void validateVoucher(
            User user,
            Voucher voucher,
            List<CartItem> items
    ) {
        if (voucher.getVoucherStatus() != Voucher.VoucherStatus.active) {
            throw new AppException(
                    "Voucher không còn hoạt động",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_INACTIVE"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (voucher.getStartTime() != null && voucher.getStartTime().isAfter(now)) {
            throw new AppException(
                    "Voucher chưa đến thời gian sử dụng",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_NOT_STARTED"
            );
        }

        if (voucher.getEndTime() != null && voucher.getEndTime().isBefore(now)) {
            throw new AppException(
                    "Voucher đã hết hạn",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_EXPIRED"
            );
        }

        if (
                voucher.getUsageLimit() != null
                        && voucher.getUsageLimit() > 0
                        && safeInt(voucher.getUsedCount()) >= voucher.getUsageLimit()
        ) {
            throw new AppException(
                    "Voucher đã hết lượt sử dụng",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_USED_OUT"
            );
        }

        UserVoucher userVoucher = userVoucherRepo.findByUserAndVoucher(user, voucher)
                .orElseThrow(() -> new AppException(
                        "Bạn cần lưu voucher trước khi sử dụng",
                        HttpStatus.BAD_REQUEST,
                        "VOUCHER_NOT_SAVED"
                ));

        if (
                voucher.getPerUserLimit() != null
                        && voucher.getPerUserLimit() > 0
                        && safeInt(userVoucher.getUsedCount()) >= voucher.getPerUserLimit()
        ) {
            throw new AppException(
                    "Bạn đã dùng hết lượt của voucher này",
                    HttpStatus.BAD_REQUEST,
                    "USER_VOUCHER_LIMIT_REACHED"
            );
        }

        BigDecimal applicableSubtotal = calculateApplicableSubtotal(items, voucher);

        if (applicableSubtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(
                    "Voucher không áp dụng cho các sản phẩm đã chọn",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_NOT_APPLICABLE"
            );
        }

        BigDecimal minOrderAmount = safeMoney(voucher.getMinOrderAmount());

        if (applicableSubtotal.compareTo(minOrderAmount) < 0) {
            throw new AppException(
                    "Đơn hàng chưa đạt giá trị tối thiểu để dùng voucher",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_MIN_ORDER_NOT_MET"
            );
        }
    }

    private CheckoutSummaryResponse buildSummary(
            List<CartItem> items,
            Voucher voucher
    ) {
        BigDecimal subtotal = items.stream()
                .map(this::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discount = voucher == null
                ? BigDecimal.ZERO
                : calculateDiscount(items, voucher);

        BigDecimal shippingFee = DEFAULT_SHIPPING_FEE;
        BigDecimal total = subtotal.add(shippingFee).subtract(discount);

        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        Map<Integer, List<CartItem>> itemsByShop = items.stream()
                .collect(Collectors.groupingBy(item ->
                        item.getVariant().getProduct().getShop().getShopId()
                ));

        List<CheckoutSummaryResponse.ShopGroup> shopGroups = itemsByShop.values()
                .stream()
                .map(this::toShopGroup)
                .sorted(Comparator.comparing(group -> group.getShopName() == null ? "" : group.getShopName()))
                .toList();

        return CheckoutSummaryResponse.builder()
                .shops(shopGroups)
                .totalItems(items.size())
                .totalQuantity(items.stream()
                        .map(CartItem::getQuantity)
                        .filter(Objects::nonNull)
                        .reduce(0, Integer::sum))
                .subtotalAmount(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(discount)
                .totalAmount(total)
                .appliedVoucher(voucher == null ? null : toAppliedVoucher(voucher, discount))
                .build();
    }

    private CheckoutSummaryResponse.ShopGroup toShopGroup(List<CartItem> items) {
        CartItem first = items.get(0);
        Shop shop = first.getVariant().getProduct().getShop();

        BigDecimal shopSubtotal = items.stream()
                .map(this::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CheckoutSummaryResponse.ShopGroup.builder()
                .shopId(shop.getShopId())
                .shopName(shop.getShopName())
                .shopSlug(shop.getShopSlug())
                .shopSubtotal(shopSubtotal)
                .items(items.stream()
                        .map(this::toItemResponse)
                        .toList())
                .build();
    }

    private CheckoutSummaryResponse.Item toItemResponse(CartItem item) {
        ProductVariant variant = item.getVariant();
        Product product = variant.getProduct();

        return CheckoutSummaryResponse.Item.builder()
                .cartItemId(item.getCartItemId())
                .productId(product.getProductId())
                .productName(product.getProductName())
                .thumbnailUrl(product.getThumbnailUrl())
                .variantId(variant.getVariantId())
                .variantName(variant.getVariantName())
                .sku(variant.getSku())
                .variantImageUrl(variant.getImageUrl())
                .quantity(item.getQuantity())
                .stockQuantity(variant.getStockQuantity())
                .price(variant.getPrice())
                .originalPrice(variant.getOriginalPrice())
                .lineTotal(lineTotal(item))
                .build();
    }

    private CheckoutSummaryResponse.AppliedVoucher toAppliedVoucher(
            Voucher voucher,
            BigDecimal discountAmount
    ) {
        Shop shop = voucher.getShop();

        return CheckoutSummaryResponse.AppliedVoucher.builder()
                .voucherId(voucher.getVoucherId())
                .code(voucher.getCode())
                .voucherName(voucher.getVoucherName())
                .discountType(voucher.getDiscountType() == null ? null : voucher.getDiscountType().name())
                .discountValue(voucher.getDiscountValue())
                .discountAmount(discountAmount)
                .shopId(shop == null ? null : shop.getShopId())
                .shopName(shop == null ? null : shop.getShopName())
                .scope(voucher.getScope() == null ? null : voucher.getScope().name())
                .build();
    }

    private BigDecimal calculateApplicableSubtotal(
            List<CartItem> items,
            Voucher voucher
    ) {
        if (voucher.getScope() == Voucher.Scope.platform) {
            return items.stream()
                    .map(this::lineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        if (voucher.getScope() == Voucher.Scope.shop && voucher.getShop() != null) {
            Integer shopId = voucher.getShop().getShopId();

            return items.stream()
                    .filter(item -> shopId.equals(
                            item.getVariant().getProduct().getShop().getShopId()
                    ))
                    .map(this::lineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        return BigDecimal.ZERO;
    }

    private BigDecimal calculateDiscount(
            List<CartItem> items,
            Voucher voucher
    ) {
        BigDecimal applicableSubtotal = calculateApplicableSubtotal(items, voucher);

        if (applicableSubtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountValue = safeMoney(voucher.getDiscountValue());
        BigDecimal discount;

        if (voucher.getDiscountType() == Voucher.DiscountType.percent) {
            discount = applicableSubtotal
                    .multiply(discountValue)
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);

            BigDecimal maxDiscount = safeMoney(voucher.getMaxDiscountAmount());
            if (maxDiscount.compareTo(BigDecimal.ZERO) > 0 && discount.compareTo(maxDiscount) > 0) {
                discount = maxDiscount;
            }
        } else {
            discount = discountValue;
        }

        if (discount.compareTo(applicableSubtotal) > 0) {
            discount = applicableSubtotal;
        }

        return discount.max(BigDecimal.ZERO);
    }

    private void applyVoucherUsage(
            User user,
            Voucher voucher
    ) {
        voucher.setUsedCount(safeInt(voucher.getUsedCount()) + 1);
        voucherRepo.save(voucher);

        UserVoucher userVoucher = userVoucherRepo.findByUserAndVoucher(user, voucher)
                .orElseThrow(() -> new AppException(
                        "Bạn cần lưu voucher trước khi sử dụng",
                        HttpStatus.BAD_REQUEST,
                        "VOUCHER_NOT_SAVED"
                ));

        userVoucher.setUsedCount(safeInt(userVoucher.getUsedCount()) + 1);
        userVoucherRepo.save(userVoucher);
    }

    private BigDecimal lineTotal(CartItem item) {
        return safeMoney(item.getVariant().getPrice())
                .multiply(BigDecimal.valueOf(safeInt(item.getQuantity())));
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private String toOrderCode(Integer orderId) {
        if (orderId == null) {
            return "DH000000";
        }

        return "DH" + String.format("%06d", orderId);
    }
}
