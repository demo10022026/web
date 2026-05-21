package com.ecommerce.service.impl;

import com.ecommerce.dto.response.VoucherResponse;
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
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepo;
    private final UserVoucherRepository userVoucherRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getAvailableVouchers(
            String email,
            String scope,
            String keyword
    ) {
        User user = findUser(email);

        String cleanScope = normalizeText(scope);
        String cleanKeyword = normalizeText(keyword);

        Set<Integer> savedVoucherIds = userVoucherRepo
                .findByUserOrderBySavedAtDesc(user)
                .stream()
                .map(userVoucher -> userVoucher.getVoucher().getVoucherId())
                .collect(Collectors.toSet());

        return voucherRepo.findAll()
                .stream()
                .filter(this::isAvailableToSave)
                .filter(voucher -> filterScope(voucher, cleanScope))
                .filter(voucher -> filterKeyword(voucher, cleanKeyword))
                .sorted(Comparator.comparing(
                        Voucher::getEndTime,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ).thenComparing(
                        Voucher::getVoucherId,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .map(voucher -> toResponse(
                        voucher,
                        savedVoucherIds.contains(voucher.getVoucherId()),
                        getUserUsedCount(user, voucher)
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getMyVouchers(
            String email,
            String status,
            String keyword
    ) {
        User user = findUser(email);

        String cleanStatus = normalizeText(status);
        String cleanKeyword = normalizeText(keyword);

        return userVoucherRepo.findByUserOrderBySavedAtDesc(user)
                .stream()
                .map(userVoucher -> {
                    Voucher voucher = userVoucher.getVoucher();

                    return toResponse(
                            voucher,
                            true,
                            safeInt(userVoucher.getUsedCount())
                    );
                })
                .filter(response -> filterSavedStatus(response, cleanStatus))
                .filter(response -> filterResponseKeyword(response, cleanKeyword))
                .sorted(Comparator.comparing(
                        VoucherResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
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

        if (!isAvailableToSave(voucher)) {
            throw new AppException(
                    "Voucher không còn khả dụng",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_NOT_AVAILABLE"
            );
        }

        if (userVoucherRepo.existsByUserAndVoucher(user, voucher)) {
            throw new AppException(
                    "Bạn đã lưu voucher này",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_ALREADY_SAVED"
            );
        }

        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .usedCount(0)
                .build();

        userVoucherRepo.save(userVoucher);

        return toResponse(voucher, true, 0);
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

        UserVoucher userVoucher = userVoucherRepo.findByUserAndVoucher(user, voucher)
                .orElseThrow(() -> AppException.notFound("Voucher đã lưu"));

        if (safeInt(userVoucher.getUsedCount()) > 0) {
            throw new AppException(
                    "Không thể bỏ lưu voucher đã sử dụng",
                    HttpStatus.BAD_REQUEST,
                    "VOUCHER_ALREADY_USED"
            );
        }

        userVoucherRepo.delete(userVoucher);
    }

    private VoucherResponse toResponse(
            Voucher voucher,
            boolean saved,
            int userUsedCount
    ) {
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
                .shopId(voucher.getShop() == null
                        ? null
                        : voucher.getShop().getShopId())
                .shopName(voucher.getShop() == null
                        ? null
                        : voucher.getShop().getShopName())

                .usageLimit(voucher.getUsageLimit())
                .usedCount(safeInt(voucher.getUsedCount()))
                .perUserLimit(voucher.getPerUserLimit())
                .userUsedCount(userUsedCount)

                .startTime(voucher.getStartTime())
                .endTime(voucher.getEndTime())
                .createdAt(voucher.getCreatedAt())

                .voucherStatus(resolveVoucherStatus(voucher))
                .saved(saved)
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

        if (isUsageLimitReached(voucher)) {
            return "used_out";
        }

        return "active";
    }

    private boolean isAvailableToSave(Voucher voucher) {
        if (voucher.getVoucherStatus() != Voucher.VoucherStatus.active) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        if (voucher.getStartTime() != null && voucher.getStartTime().isAfter(now)) {
            return false;
        }

        if (voucher.getEndTime() != null && voucher.getEndTime().isBefore(now)) {
            return false;
        }

        return !isUsageLimitReached(voucher);
    }

    private boolean isUsageLimitReached(Voucher voucher) {
        Integer usageLimit = voucher.getUsageLimit();
        Integer usedCount = voucher.getUsedCount();

        return usageLimit != null
                && usageLimit > 0
                && usedCount != null
                && usedCount >= usageLimit;
    }

    private boolean filterScope(
            Voucher voucher,
            String scope
    ) {
        if (scope == null || scope.equals("all")) {
            return true;
        }

        if (voucher.getScope() == null) {
            return false;
        }

        return voucher.getScope().name().equals(scope);
    }

    private boolean filterKeyword(
            Voucher voucher,
            String keyword
    ) {
        if (keyword == null) {
            return true;
        }

        String lower = keyword.toLowerCase();

        return contains(voucher.getCode(), lower)
                || contains(voucher.getVoucherName(), lower)
                || (
                        voucher.getShop() != null
                                && contains(voucher.getShop().getShopName(), lower)
                );
    }

    private boolean filterResponseKeyword(
            VoucherResponse response,
            String keyword
    ) {
        if (keyword == null) {
            return true;
        }

        String lower = keyword.toLowerCase();

        return contains(response.getCode(), lower)
                || contains(response.getVoucherName(), lower)
                || contains(response.getShopName(), lower);
    }

    private boolean filterSavedStatus(
            VoucherResponse response,
            String status
    ) {
        if (status == null || status.equals("all")) {
            return true;
        }

        if (status.equals("usable")) {
            return "active".equals(response.getVoucherStatus())
                    && !isUserUsedOut(response);
        }

        if (status.equals("expired")) {
            return "expired".equals(response.getVoucherStatus())
                    || "inactive".equals(response.getVoucherStatus());
        }

        if (status.equals("used")) {
            return "used_out".equals(response.getVoucherStatus())
                    || isUserUsedOut(response);
        }

        return status.equals(response.getVoucherStatus());
    }

    private boolean isUserUsedOut(VoucherResponse response) {
        return response.getPerUserLimit() != null
                && response.getPerUserLimit() > 0
                && response.getUserUsedCount() != null
                && response.getUserUsedCount() >= response.getPerUserLimit();
    }

    private int getUserUsedCount(
            User user,
            Voucher voucher
    ) {
        return userVoucherRepo.findByUserAndVoucher(user, voucher)
                .map(UserVoucher::getUsedCount)
                .map(this::safeInt)
                .orElse(0);
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
