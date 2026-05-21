package com.ecommerce.service.impl;

import com.ecommerce.dto.response.AdminVoucherShopLookupResponse;
import com.ecommerce.dto.request.AdminUpdateVoucherStatusRequest;
import com.ecommerce.dto.request.AdminVoucherRequest;
import com.ecommerce.dto.response.AdminVoucherResponse;
import com.ecommerce.dto.response.AdminVoucherStatsResponse;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.entity.Voucher;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.repository.UserVoucherRepository;
import com.ecommerce.repository.VoucherRepository;
import com.ecommerce.service.AdminVoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminVoucherServiceImpl implements AdminVoucherService {

    private final VoucherRepository voucherRepo;
    private final UserVoucherRepository userVoucherRepo;
    private final UserRepository userRepo;
    private final ShopRepository shopRepo;

    @Override
    @Transactional(readOnly = true)
    public AdminVoucherShopLookupResponse getShopLookup(Integer shopId) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> AppException.notFound("Shop"));

        return AdminVoucherShopLookupResponse.builder()
                .shopId(shop.getShopId())
                .shopName(shop.getShopName())
                .shopSlug(shop.getShopSlug())
                .shopStatus(shop.getShopStatus() == null
                        ? null
                        : shop.getShopStatus().name())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminVoucherResponse> getVouchers(
            String scope,
            String status,
            String keyword,
            int page,
            int size
    ) {
        Voucher.Scope voucherScope = parseScope(scope);
        String cleanStatus = normalizeStatus(status);
        String cleanKeyword = normalizeText(keyword);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50)
        );

        return voucherRepo.adminSearchVouchers(
                voucherScope,
                cleanStatus,
                cleanKeyword,
                LocalDateTime.now(),
                Voucher.VoucherStatus.active,
                Voucher.VoucherStatus.inactive,
                pageable
        ).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminVoucherStatsResponse getStats() {
        List<Voucher> vouchers = voucherRepo.findAll();

        long active = 0;
        long inactive = 0;
        long upcoming = 0;
        long expired = 0;
        long usedOut = 0;
        long platform = 0;
        long shop = 0;

        for (Voucher voucher : vouchers) {
            String status = resolveVoucherStatus(voucher);

            switch (status) {
                case "active" -> active++;
                case "inactive" -> inactive++;
                case "upcoming" -> upcoming++;
                case "expired" -> expired++;
                case "used_out" -> usedOut++;
                default -> {
                }
            }

            if (voucher.getScope() == Voucher.Scope.platform) {
                platform++;
            } else if (voucher.getScope() == Voucher.Scope.shop) {
                shop++;
            }
        }

        return AdminVoucherStatsResponse.builder()
                .totalVouchers(vouchers.size())
                .activeVouchers(active)
                .inactiveVouchers(inactive)
                .upcomingVouchers(upcoming)
                .expiredVouchers(expired)
                .usedOutVouchers(usedOut)
                .platformVouchers(platform)
                .shopVouchers(shop)
                .totalSavedVouchers(userVoucherRepo.count())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminVoucherResponse getVoucherDetail(Integer voucherId) {
        Voucher voucher = voucherRepo.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher"));

        return toResponse(voucher);
    }

    @Override
    @Transactional
    public AdminVoucherResponse createVoucher(
            String actorEmail,
            AdminVoucherRequest request
    ) {
        requireAdmin(actorEmail);
        validateRequest(request, null);

        String code = normalizeRequired(request.getCode()).toUpperCase();

        voucherRepo.findByCodeIgnoreCase(code).ifPresent(existing -> {
            throw new AppException(
                    "Mã voucher đã tồn tại",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_CODE_EXISTS"
            );
        });

        Shop shop = resolveShop(request.getScope(), request.getShopId());

        Voucher voucher = Voucher.builder()
                .code(code)
                .voucherName(normalizeRequired(request.getVoucherName()))
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderAmount(defaultMoney(request.getMinOrderAmount()))
                .scope(request.getScope())
                .shop(shop)
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .perUserLimit(request.getPerUserLimit())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .voucherStatus(request.getVoucherStatus() == null
                        ? Voucher.VoucherStatus.active
                        : request.getVoucherStatus())
                .build();

        return toResponse(voucherRepo.save(voucher));
    }

    @Override
    @Transactional
    public AdminVoucherResponse updateVoucher(
            String actorEmail,
            Integer voucherId,
            AdminVoucherRequest request
    ) {
        requireAdmin(actorEmail);

        Voucher voucher = voucherRepo.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher"));

        validateRequest(request, voucher.getVoucherId());

        String code = normalizeRequired(request.getCode()).toUpperCase();

        voucherRepo.findByCodeIgnoreCase(code).ifPresent(existing -> {
            if (!existing.getVoucherId().equals(voucher.getVoucherId())) {
                throw new AppException(
                        "Mã voucher đã tồn tại",
                        HttpStatus.BAD_REQUEST,
                        "VOUCHER_CODE_EXISTS"
                );
            }
        });

        Shop shop = resolveShop(request.getScope(), request.getShopId());

        voucher.setCode(code);
        voucher.setVoucherName(normalizeRequired(request.getVoucherName()));
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setMinOrderAmount(defaultMoney(request.getMinOrderAmount()));
        voucher.setScope(request.getScope());
        voucher.setShop(shop);
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setPerUserLimit(request.getPerUserLimit());
        voucher.setStartTime(request.getStartTime());
        voucher.setEndTime(request.getEndTime());
        voucher.setVoucherStatus(request.getVoucherStatus() == null
                ? Voucher.VoucherStatus.active
                : request.getVoucherStatus());

        return toResponse(voucherRepo.save(voucher));
    }

    @Override
    @Transactional
    public AdminVoucherResponse updateVoucherStatus(
            String actorEmail,
            Integer voucherId,
            AdminUpdateVoucherStatusRequest request
    ) {
        requireAdmin(actorEmail);

        Voucher voucher = voucherRepo.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher"));

        voucher.setVoucherStatus(request.getVoucherStatus());

        return toResponse(voucherRepo.save(voucher));
    }

    private void validateRequest(
            AdminVoucherRequest request,
            Integer currentVoucherId
    ) {
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

        if (request.getDiscountValue() == null
                || request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(
                    "Giá trị giảm phải lớn hơn 0",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_DISCOUNT_VALUE"
            );
        }

        if (request.getDiscountType() == Voucher.DiscountType.percent
                && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new AppException(
                    "Voucher phần trăm không được vượt quá 100%",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PERCENT_DISCOUNT"
            );
        }

        if (request.getMaxDiscountAmount() != null
                && request.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(
                    "Mức giảm tối đa không được âm",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_MAX_DISCOUNT"
            );
        }

        if (request.getMinOrderAmount() != null
                && request.getMinOrderAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(
                    "Giá trị đơn tối thiểu không được âm",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_MIN_ORDER_AMOUNT"
            );
        }

        if (request.getScope() == null) {
            throw new AppException(
                    "Phạm vi voucher không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_VOUCHER_SCOPE"
            );
        }

        if (request.getScope() == Voucher.Scope.shop && request.getShopId() == null) {
            throw new AppException(
                    "Voucher shop cần chọn shop",
                    HttpStatus.BAD_REQUEST,
                    "SHOP_REQUIRED_FOR_VOUCHER"
            );
        }

        if (request.getUsageLimit() == null || request.getUsageLimit() <= 0) {
            throw new AppException(
                    "Tổng lượt sử dụng phải lớn hơn 0",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_USAGE_LIMIT"
            );
        }

        if (request.getPerUserLimit() == null || request.getPerUserLimit() <= 0) {
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

    private Shop resolveShop(
            Voucher.Scope scope,
            Integer shopId
    ) {
        if (scope == Voucher.Scope.platform) {
            return null;
        }

        return shopRepo.findById(shopId)
                .orElseThrow(() -> AppException.notFound("Shop"));
    }

    private AdminVoucherResponse toResponse(Voucher voucher) {
        int usedCount = safeInt(voucher.getUsedCount());
        int usageLimit = safeInt(voucher.getUsageLimit());
        int remaining = usageLimit <= 0 ? 0 : Math.max(usageLimit - usedCount, 0);

        return AdminVoucherResponse.builder()
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
                .shopSlug(voucher.getShop() == null
                        ? null
                        : voucher.getShop().getShopSlug())

                .usageLimit(voucher.getUsageLimit())
                .usedCount(usedCount)
                .remainingCount(remaining)
                .perUserLimit(voucher.getPerUserLimit())

                .savedCount(userVoucherRepo.countByVoucher(voucher))
                .userUsedCount(userVoucherRepo.countByVoucherAndUsedCountGreaterThan(voucher, 0))

                .startTime(voucher.getStartTime())
                .endTime(voucher.getEndTime())
                .createdAt(voucher.getCreatedAt())

                .voucherStatus(resolveVoucherStatus(voucher))
                .rawStatus(voucher.getVoucherStatus() == null
                        ? null
                        : voucher.getVoucherStatus().name())
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

        if (usageLimit != null
                && usageLimit > 0
                && usedCount != null
                && usedCount >= usageLimit) {
            return "used_out";
        }

        return "active";
    }

    private Voucher.Scope parseScope(String scope) {
        String clean = normalizeText(scope);

        if (clean == null || clean.equals("all")) {
            return null;
        }

        try {
            return Voucher.Scope.valueOf(clean);
        } catch (IllegalArgumentException e) {
            throw new AppException(
                    "Phạm vi voucher không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_VOUCHER_SCOPE"
            );
        }
    }

    private String normalizeStatus(String status) {
        String clean = normalizeText(status);

        if (clean == null || clean.equals("all")) {
            return null;
        }

        if (clean.equals("used_up")) {
            return "used_out";
        }

        return switch (clean) {
            case "active", "inactive", "upcoming", "expired", "used_out" -> clean;
            default -> throw new AppException(
                    "Trạng thái voucher không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_VOUCHER_STATUS"
            );
        };
    }

    private void requireAdmin(String actorEmail) {
        User actor = userRepo.findByEmail(actorEmail)
                .orElseThrow(() -> AppException.notFound("Tài khoản quản trị"));

        if (actor.getRole() != User.Role.admin) {
            throw new AppException(
                    "Chỉ admin mới có quyền thay đổi voucher",
                    HttpStatus.FORBIDDEN,
                    "ONLY_ADMIN_CAN_MANAGE_VOUCHERS"
            );
        }
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

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
