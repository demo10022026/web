package com.ecommerce.service.impl;

import com.ecommerce.dto.request.AdminUpdateUserRequest;
import com.ecommerce.dto.response.AdminUserResponse;
import com.ecommerce.dto.response.AdminUserStatsResponse;
import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(
            String keyword,
            String role,
            String status,
            int page,
            int size
    ) {
        User.Role roleFilter = parseRole(role);
        User.AccountStatus statusFilter = parseAccountStatus(status);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50)
        );

        return userRepo.adminSearchUsers(
                roleFilter,
                statusFilter,
                normalizeText(keyword),
                pageable
        ).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserDetail(Integer userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> AppException.notFound("User"));

        return toResponse(user);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUser(
            String actorEmail,
            Integer userId,
            AdminUpdateUserRequest request
    ) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> AppException.notFound("User"));

        if (request == null) {
            throw new AppException(
                    "Dữ liệu cập nhật không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_USER_UPDATE"
            );
        }

        preventSelfLockOrDemote(actorEmail, user, request);

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        if (request.getAccountStatus() != null) {
            user.setAccountStatus(request.getAccountStatus());
        }

        User saved = userRepo.save(user);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserStatsResponse getStats() {
        return AdminUserStatsResponse.builder()
                .totalUsers(userRepo.count())

                .activeUsers(userRepo.countByAccountStatus(User.AccountStatus.active))
                .suspendedUsers(userRepo.countByAccountStatus(User.AccountStatus.suspended))
                .bannedUsers(userRepo.countByAccountStatus(User.AccountStatus.banned))

                .normalUsers(userRepo.countByRole(User.Role.user))
                .sellerUsers(userRepo.countByRole(User.Role.seller))
                .adminUsers(userRepo.countByRole(User.Role.admin))
                .managerUsers(userRepo.countByRole(User.Role.manager))
                .build();
    }

    private void preventSelfLockOrDemote(
            String actorEmail,
            User target,
            AdminUpdateUserRequest request
    ) {
        if (actorEmail == null || target.getEmail() == null) {
            return;
        }

        if (!actorEmail.equalsIgnoreCase(target.getEmail())) {
            return;
        }

        if (
                request.getAccountStatus() != null
                        && request.getAccountStatus() != User.AccountStatus.active
        ) {
            throw new AppException(
                    "Không thể tự khóa tài khoản đang đăng nhập",
                    HttpStatus.BAD_REQUEST,
                    "CANNOT_LOCK_SELF"
            );
        }

        if (
                request.getRole() != null
                        && request.getRole() != User.Role.admin
                        && request.getRole() != User.Role.manager
        ) {
            throw new AppException(
                    "Không thể tự hạ quyền tài khoản đang đăng nhập",
                    HttpStatus.BAD_REQUEST,
                    "CANNOT_DEMOTE_SELF"
            );
        }
    }

    private AdminUserResponse toResponse(User user) {
        SellerProfile seller = sellerRepo.findByUser(user).orElse(null);
        Shop shop = seller == null
                ? null
                : shopRepo.findBySeller(seller).orElse(null);

        return AdminUserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())

                .gender(user.getGender() == null
                        ? null
                        : user.getGender().name())
                .birthDate(user.getBirthDate())

                .role(user.getRole() == null
                        ? null
                        : user.getRole().name())
                .accountStatus(user.getAccountStatus() == null
                        ? null
                        : user.getAccountStatus().name())

                .emailVerified(user.getEmailVerified())
                .phoneVerified(user.getPhoneVerified())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())

                .hasSellerProfile(seller != null)
                .sellerId(seller == null
                        ? null
                        : seller.getSellerId())
                .sellerStatus(seller == null || seller.getVerificationStatus() == null
                        ? null
                        : seller.getVerificationStatus().name())
                .identityNumber(seller == null
                        ? null
                        : seller.getIdentityNumber())
                .taxCode(seller == null
                        ? null
                        : seller.getTaxCode())

                .shopId(shop == null
                        ? null
                        : shop.getShopId())
                .shopName(shop == null
                        ? null
                        : shop.getShopName())
                .shopSlug(shop == null
                        ? null
                        : shop.getShopSlug())
                .shopStatus(shop == null || shop.getShopStatus() == null
                        ? null
                        : shop.getShopStatus().name())
                .build();
    }

    private User.Role parseRole(String value) {
        String clean = normalizeText(value);

        if (clean == null || clean.equals("all")) {
            return null;
        }

        try {
            return User.Role.valueOf(clean);
        } catch (IllegalArgumentException e) {
            throw new AppException(
                    "Vai trò không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_USER_ROLE"
            );
        }
    }

    private User.AccountStatus parseAccountStatus(String value) {
        String clean = normalizeText(value);

        if (clean == null || clean.equals("all")) {
            return null;
        }

        try {
            return User.AccountStatus.valueOf(clean);
        } catch (IllegalArgumentException e) {
            throw new AppException(
                    "Trạng thái tài khoản không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ACCOUNT_STATUS"
            );
        }
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }
}
