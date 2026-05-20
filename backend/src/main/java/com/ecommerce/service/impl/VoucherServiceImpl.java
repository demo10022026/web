package com.ecommerce.service.impl;

import com.ecommerce.dto.response.VoucherResponse;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserVoucher;
import com.ecommerce.entity.Voucher;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.repository.UserVoucherRepository;
import com.ecommerce.repository.VoucherRepository;
import com.ecommerce.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final UserRepository userRepo;
    private final VoucherRepository voucherRepo;
    private final UserVoucherRepository userVoucherRepo;

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getAvailableVouchers(
            String email,
            String scope
    ) {
        User user = findUser(email);

        LocalDateTime now = LocalDateTime.now();
        Voucher.Scope voucherScope = parseScope(scope);

        List<Voucher> vouchers = voucherScope == null
                ? voucherRepo.findActiveUsableVouchers(now)
                : voucherRepo.findActiveUsableVouchersByScope(now, voucherScope);

        Map<Integer, UserVoucher> savedMap = userVoucherRepo
                .findByUserOrderBySavedAtDesc(user)
                .stream()
                .collect(Collectors.toMap(
                        uv -> uv.getVoucher().getVoucherId(),
                        Function.identity(),
                        (a, b) -> a
                ));

        return vouchers.stream()
                .map(voucher -> toResponse(
                        voucher,
                        savedMap.get(voucher.getVoucherId()),
                        now
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getMyVouchers(
            String email,
            String status
    ) {
        User user = findUser(email);

        LocalDateTime now = LocalDateTime.now();
        String cleanStatus = normalizeText(status);

        return userVoucherRepo.findByUserOrderBySavedAtDesc(user)
                .stream()
                .map(uv -> toResponse(uv.getVoucher(), uv, now))
                .filter(voucher -> matchStatus(voucher, cleanStatus))
                .toList();
    }

    @Override
    @Transactional
    public VoucherResponse saveVoucher(
            String email,
            Integer voucherId
    ) {
        User user = findUser(email);

        Voucher voucher = voucherRepo.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher"));

        LocalDateTime now = LocalDateTime.now();

        if (!isVoucherActive(voucher, now)) {
            throw new AppException(
                    "Voucher hiện không thể lưu",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_NOT_AVAILABLE"
            );
        }

        UserVoucher userVoucher = userVoucherRepo
                .findByUserAndVoucher(user, voucher)
                .orElseGet(() -> userVoucherRepo.save(
                        UserVoucher.builder()
                                .user(user)
                                .voucher(voucher)
                                .usedCount(0)
                                .build()
                ));

        return toResponse(voucher, userVoucher, now);
    }

    @Override
    @Transactional
    public void removeSavedVoucher(
            String email,
            Integer voucherId
    ) {
        User user = findUser(email);

        Voucher voucher = voucherRepo.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher"));

        UserVoucher userVoucher = userVoucherRepo
                .findByUserAndVoucher(user, voucher)
                .orElseThrow(() -> AppException.notFound("Voucher đã lưu"));

        if (safeInt(userVoucher.getUsedCount()) > 0) {
            throw new AppException(
                    "Không thể xóa voucher đã sử dụng",
                    HttpStatus.BAD_REQUEST,
                    "USED_VOUCHER_CANNOT_REMOVE"
            );
        }

        userVoucherRepo.delete(userVoucher);
    }

    private VoucherResponse toResponse(
            Voucher voucher,
            UserVoucher userVoucher,
            LocalDateTime now
    ) {
        Shop shop = voucher.getShop();

        int remainingCount = voucher.getUsageLimit() == null
                ? -1
                : Math.max(0, voucher.getUsageLimit() - safeInt(voucher.getUsedCount()));

        int userUsedCount = userVoucher == null ? 0 : safeInt(userVoucher.getUsedCount());

        String unavailableReason = getUnavailableReason(voucher, userVoucher, now);

        return VoucherResponse.builder()
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
                .shopId(shop == null ? null : shop.getShopId())
                .shopName(shop == null ? null : shop.getShopName())
                .shopSlug(shop == null ? null : shop.getShopSlug())

                .usageLimit(voucher.getUsageLimit())
                .usedCount(safeInt(voucher.getUsedCount()))
                .remainingCount(remainingCount)
                .perUserLimit(voucher.getPerUserLimit())
                .userUsedCount(userUsedCount)

                .startTime(voucher.getStartTime())
                .endTime(voucher.getEndTime())
                .voucherStatus(voucher.getVoucherStatus() == null
                        ? null
                        : voucher.getVoucherStatus().name())

                .saved(userVoucher != null)
                .usable(unavailableReason == null)
                .unavailableReason(unavailableReason)
                .build();
    }

    private boolean matchStatus(
            VoucherResponse voucher,
            String status
    ) {
        if (status == null || status.equals("all")) {
            return true;
        }

        return switch (status) {
            case "usable" -> Boolean.TRUE.equals(voucher.getUsable());
            case "expired" -> "Voucher đã hết hạn".equals(voucher.getUnavailableReason())
                    || "Voucher chưa bắt đầu".equals(voucher.getUnavailableReason())
                    || "Voucher đã tạm dừng".equals(voucher.getUnavailableReason());
            case "used" -> "Bạn đã dùng hết lượt voucher này".equals(voucher.getUnavailableReason());
            default -> true;
        };
    }

    private String getUnavailableReason(
            Voucher voucher,
            UserVoucher userVoucher,
            LocalDateTime now
    ) {
        if (voucher.getVoucherStatus() != Voucher.VoucherStatus.active) {
            return "Voucher đã tạm dừng";
        }

        if (voucher.getStartTime() != null && voucher.getStartTime().isAfter(now)) {
            return "Voucher chưa bắt đầu";
        }

        if (voucher.getEndTime() != null && voucher.getEndTime().isBefore(now)) {
            return "Voucher đã hết hạn";
        }

        if (voucher.getUsageLimit() != null
                && safeInt(voucher.getUsedCount()) >= voucher.getUsageLimit()) {
            return "Voucher đã hết lượt";
        }

        if (userVoucher != null
                && voucher.getPerUserLimit() != null
                && safeInt(userVoucher.getUsedCount()) >= voucher.getPerUserLimit()) {
            return "Bạn đã dùng hết lượt voucher này";
        }

        return null;
    }

    private boolean isVoucherActive(
            Voucher voucher,
            LocalDateTime now
    ) {
        return getUnavailableReason(voucher, null, now) == null;
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

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
