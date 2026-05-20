package com.ecommerce.service.impl;

import com.ecommerce.dto.request.SellerVoucherRequest;
import com.ecommerce.dto.response.SellerVoucherResponse;
import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.entity.Voucher;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.SellerVoucherRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.SellerVoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerVoucherServiceImpl implements SellerVoucherService {

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;
    private final SellerVoucherRepository sellerVoucherRepo;

    @Override
    @Transactional(readOnly = true)
    public Page<SellerVoucherResponse> getMyShopVouchers(
            String email,
            String keyword,
            String status,
            int page,
            int size
    ) {
        Shop shop = findActiveShop(email);

        String cleanKeyword = normalizeText(keyword);
        String cleanStatus = normalizeText(status);

        List<SellerVoucherResponse> filtered = sellerVoucherRepo
                .findByShopOrderByCreatedAtDesc(shop)
                .stream()
                .map(this::toResponse)
                .filter(response -> filterKeyword(response, cleanKeyword))
                .filter(response -> filterStatus(response, cleanStatus))
                .sorted(Comparator.comparing(
                        SellerVoucherResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);

        Pageable pageable = PageRequest.of(safePage, safeSize);

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());

        List<SellerVoucherResponse> content =
                start >= filtered.size() ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(content, pageable, filtered.size());
    }

    @Override
    @Transactional
    public SellerVoucherResponse createVoucher(
            String email,
            SellerVoucherRequest request
    ) {
        Shop shop = findActiveShop(email);

        validateRequest(request);

        String code = normalizeRequired(request.getCode()).toUpperCase();

        sellerVoucherRepo.findByCode(code).ifPresent(existing -> {
            throw new AppException(
                    "Mã voucher đã tồn tại",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_CODE_EXISTS"
            );
        });

        Voucher voucher = Voucher.builder()
                .code(code)
                .voucherName(normalizeRequired(request.getVoucherName()))
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderAmount(defaultMoney(request.getMinOrderAmount()))
                .scope(Voucher.Scope.shop)
                .shop(shop)
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .perUserLimit(request.getPerUserLimit() == null
                        ? 1
                        : request.getPerUserLimit())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .voucherStatus(Voucher.VoucherStatus.active)
                .build();

        return toResponse(sellerVoucherRepo.save(voucher));
    }

    @Override
    @Transactional
    public SellerVoucherResponse updateVoucher(
            String email,
            Integer voucherId,
            SellerVoucherRequest request
    ) {
        Shop shop = findActiveShop(email);

        Voucher voucher = sellerVoucherRepo
                .findByVoucherIdAndShop(voucherId, shop)
                .orElseThrow(() -> AppException.notFound("Voucher"));

        validateRequest(request);

        String code = normalizeRequired(request.getCode()).toUpperCase();

        sellerVoucherRepo.findByCode(code).ifPresent(existing -> {
            if (!existing.getVoucherId().equals(voucher.getVoucherId())) {
                throw new AppException(
                        "Mã voucher đã tồn tại",
                        HttpStatus.BAD_REQUEST,
                        "VOUCHER_CODE_EXISTS"
                );
            }
        });

        voucher.setCode(code);
        voucher.setVoucherName(normalizeRequired(request.getVoucherName()));
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setMinOrderAmount(defaultMoney(request.getMinOrderAmount()));
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setPerUserLimit(request.getPerUserLimit() == null
                ? 1
                : request.getPerUserLimit());
        voucher.setStartTime(request.getStartTime());
        voucher.setEndTime(request.getEndTime());

        if (voucher.getVoucherStatus() == null) {
            voucher.setVoucherStatus(Voucher.VoucherStatus.active);
        }

        return toResponse(sellerVoucherRepo.save(voucher));
    }

    @Override
    @Transactional
    public SellerVoucherResponse expireVoucher(
            String email,
            Integer voucherId
    ) {
        Shop shop = findActiveShop(email);

        Voucher voucher = sellerVoucherRepo
                .findByVoucherIdAndShop(voucherId, shop)
                .orElseThrow(() -> AppException.notFound("Voucher"));

        voucher.setVoucherStatus(Voucher.VoucherStatus.inactive);
        voucher.setEndTime(LocalDateTime.now());

        return toResponse(sellerVoucherRepo.save(voucher));
    }

    private void validateRequest(SellerVoucherRequest request) {
        if (request == null) {
            throw new AppException(
                    "Dữ liệu voucher không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_VOUCHER"
            );
        }

        if (normalizeText(request.getCode()) == null) {
            throw new AppException(
                    "Mã voucher không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_CODE_REQUIRED"
            );
        }

        if (normalizeText(request.getVoucherName()) == null) {
            throw new AppException(
                    "Tên voucher không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_NAME_REQUIRED"
            );
        }

        if (request.getDiscountType() == null) {
            throw new AppException(
                    "Loại giảm giá không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "DISCOUNT_TYPE_REQUIRED"
            );
        }

        if (
                request.getDiscountValue() == null
                        || request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0
        ) {
            throw new AppException(
                    "Giá trị giảm phải lớn hơn 0",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_DISCOUNT_VALUE"
            );
        }

        if (
                request.getDiscountType() == Voucher.DiscountType.percent
                        && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0
        ) {
            throw new AppException(
                    "Voucher phần trăm không được vượt quá 100%",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PERCENT_DISCOUNT"
            );
        }

        if (
                request.getMaxDiscountAmount() != null
                        && request.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new AppException(
                    "Mức giảm tối đa không được âm",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_MAX_DISCOUNT"
            );
        }

        if (
                request.getMinOrderAmount() != null
                        && request.getMinOrderAmount().compareTo(BigDecimal.ZERO) < 0
        ) {
            throw new AppException(
                    "Giá trị đơn tối thiểu không được âm",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_MIN_ORDER_AMOUNT"
            );
        }

        if (request.getUsageLimit() != null && request.getUsageLimit() <= 0) {
            throw new AppException(
                    "Tổng lượt sử dụng phải lớn hơn 0",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_USAGE_LIMIT"
            );
        }

        if (request.getPerUserLimit() != null && request.getPerUserLimit() <= 0) {
            throw new AppException(
                    "Lượt dùng mỗi tài khoản phải lớn hơn 0",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PER_USER_LIMIT"
            );
        }

        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new AppException(
                    "Thời gian bắt đầu và kết thúc không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_TIME_REQUIRED"
            );
        }

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new AppException(
                    "Thời gian kết thúc phải sau thời gian bắt đầu",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_VOUCHER_TIME"
            );
        }
    }

    private SellerVoucherResponse toResponse(Voucher voucher) {
        return SellerVoucherResponse.builder()
                .voucherId(voucher.getVoucherId())
                .code(voucher.getCode())
                .voucherName(voucher.getVoucherName())

                .discountType(voucher.getDiscountType() == null
                        ? null
                        : voucher.getDiscountType().name())
                .discountValue(voucher.getDiscountValue())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .minOrderAmount(voucher.getMinOrderAmount())

                .scope(voucher.getScope() == null
                        ? null
                        : voucher.getScope().name())
                .shopId(voucher.getShop() == null
                        ? null
                        : voucher.getShop().getShopId())
                .shopName(voucher.getShop() == null
                        ? null
                        : voucher.getShop().getShopName())

                .usageLimit(voucher.getUsageLimit())
                .usedCount(safeInt(voucher.getUsedCount()))
                .perUserLimit(voucher.getPerUserLimit())

                .startTime(voucher.getStartTime())
                .endTime(voucher.getEndTime())
                .createdAt(voucher.getCreatedAt())

                .voucherStatus(resolveVoucherStatus(voucher))
                .build();
    }

    private String resolveVoucherStatus(Voucher voucher) {
        if (voucher.getVoucherStatus() == Voucher.VoucherStatus.inactive) {
            return "inactive";
        }

        LocalDateTime now = LocalDateTime.now();

        if (voucher.getStartTime() != null && voucher.getStartTime().isAfter(now)) {
            return "upcoming";
        }

        if (voucher.getEndTime() != null && voucher.getEndTime().isBefore(now)) {
            return "expired";
        }

        Integer usageLimit = voucher.getUsageLimit();
        Integer usedCount = voucher.getUsedCount();

        if (
                usageLimit != null
                        && usageLimit > 0
                        && usedCount != null
                        && usedCount >= usageLimit
        ) {
            return "used_out";
        }

        return "active";
    }

    private boolean filterKeyword(
            SellerVoucherResponse response,
            String keyword
    ) {
        if (keyword == null) {
            return true;
        }

        String lower = keyword.toLowerCase();

        return contains(response.getCode(), lower)
                || contains(response.getVoucherName(), lower);
    }

    private boolean filterStatus(
            SellerVoucherResponse response,
            String status
    ) {
        if (status == null || status.equals("all")) {
            return true;
        }

        return status.equals(response.getVoucherStatus());
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

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeText(value);

        return normalized == null ? "" : normalized;
    }

    private boolean contains(
            String value,
            String keywordLower
    ) {
        return value != null && value.toLowerCase().contains(keywordLower);
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
