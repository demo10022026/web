package com.ecommerce.service.impl;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.AdminResetPasswordResponse;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;
    private final PasswordEncoder passwordEncoder;

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
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt")
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

    /**
     * Endpoint cũ dùng cho trang danh sách. Vẫn giữ để không vỡ frontend cũ.
     */
    @Override
    @Transactional
    public AdminUserResponse updateUser(
            String actorEmail,
            Integer userId,
            AdminUpdateUserRequest request
    ) {
        if (request == null) {
            throw new AppException(
                    "Dữ liệu cập nhật không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_USER_UPDATE"
            );
        }

        User actor = findActor(actorEmail);
        User target = findTarget(userId);

        if (request.getFullName() != null
                || request.getEmail() != null
                || request.getPhoneNumber() != null) {
            validateCanModifyProfile(actor, target);
            applyProfile(target, request.getFullName(), request.getEmail(), request.getPhoneNumber());
        }

        if (request.getAccountStatus() != null) {
            validateCanModifyStatus(actor, target, request.getAccountStatus());
            target.setAccountStatus(request.getAccountStatus());
        }

        if (request.getRole() != null) {
            validateCanModifyRole(actor, target, request.getRole());
            target.setRole(request.getRole());
        }

        return toResponse(userRepo.save(target));
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserProfile(
            String actorEmail,
            Integer userId,
            AdminUpdateUserProfileRequest request
    ) {
        if (request == null) {
            throw new AppException(
                    "Dữ liệu cập nhật không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_USER_PROFILE_UPDATE"
            );
        }

        User actor = findActor(actorEmail);
        User target = findTarget(userId);

        validateCanModifyProfile(actor, target);
        applyProfile(target, request.getFullName(), request.getEmail(), request.getPhoneNumber());

        return toResponse(userRepo.save(target));
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserRole(
            String actorEmail,
            Integer userId,
            AdminUpdateUserRoleRequest request
    ) {
        if (request == null || request.getRole() == null) {
            throw new AppException(
                    "Vai trò không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "ROLE_REQUIRED"
            );
        }

        User actor = findActor(actorEmail);
        User target = findTarget(userId);

        validateCanModifyRole(actor, target, request.getRole());
        target.setRole(request.getRole());

        return toResponse(userRepo.save(target));
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserStatus(
            String actorEmail,
            Integer userId,
            AdminUpdateUserStatusRequest request
    ) {
        if (request == null || request.getAccountStatus() == null) {
            throw new AppException(
                    "Trạng thái tài khoản không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "ACCOUNT_STATUS_REQUIRED"
            );
        }

        User actor = findActor(actorEmail);
        User target = findTarget(userId);

        validateCanModifyStatus(actor, target, request.getAccountStatus());
        target.setAccountStatus(request.getAccountStatus());

        return toResponse(userRepo.save(target));
    }

    @Override
    @Transactional
    public AdminResetPasswordResponse resetUserPassword(
            String actorEmail,
            Integer userId,
            AdminResetUserPasswordRequest request
    ) {
        User actor = findActor(actorEmail);
        User target = findTarget(userId);

        validateCanResetPassword(actor, target);

        String temporaryPassword = request == null
                ? null
                : normalizeText(request.getTemporaryPassword());

        if (temporaryPassword == null) {
            temporaryPassword = generateTemporaryPassword(12);
        }

        if (temporaryPassword.length() < 8) {
            throw new AppException(
                    "Mật khẩu tạm phải từ 8 ký tự trở lên",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TEMPORARY_PASSWORD"
            );
        }

        target.setPassword(passwordEncoder.encode(temporaryPassword));
        userRepo.save(target);

        return AdminResetPasswordResponse.builder()
                .userId(target.getUserId())
                .email(target.getEmail())
                .temporaryPassword(temporaryPassword)
                .message("Đã reset mật khẩu. Hãy yêu cầu người dùng đổi mật khẩu sau khi đăng nhập.")
                .build();
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

    private void applyProfile(
            User target,
            String fullName,
            String email,
            String phoneNumber
    ) {
        String cleanFullName = normalizeText(fullName);
        String cleanEmail = normalizeText(email);
        String cleanPhoneNumber = normalizeText(phoneNumber);

        if (cleanFullName != null) {
            if (cleanFullName.length() > 100) {
                throw new AppException(
                        "Họ tên tối đa 100 ký tự",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_FULL_NAME"
                );
            }

            target.setFullName(cleanFullName);
        }

        if (cleanEmail != null && !cleanEmail.equalsIgnoreCase(target.getEmail())) {
            ensureEmailAvailable(cleanEmail, target.getUserId());
            target.setEmail(cleanEmail);
            target.setEmailVerified(false);
        }

        if (cleanPhoneNumber != null && !cleanPhoneNumber.equals(target.getPhoneNumber())) {
            ensurePhoneAvailable(cleanPhoneNumber, target.getUserId());
            target.setPhoneNumber(cleanPhoneNumber);
            target.setPhoneVerified(false);
        }
    }

    private void validateCanModifyProfile(User actor, User target) {
        validateAdminOrManager(actor);

        if (actor.getRole() == User.Role.manager && target.getRole() == User.Role.admin) {
            throw new AppException(
                    "Manager không thể sửa tài khoản admin",
                    HttpStatus.FORBIDDEN,
                    "MANAGER_CANNOT_MODIFY_ADMIN"
            );
        }
    }

    private void validateCanResetPassword(User actor, User target) {
        validateAdminOrManager(actor);

        if (actor.getRole() == User.Role.manager && target.getRole() == User.Role.admin) {
            throw new AppException(
                    "Manager không thể reset mật khẩu tài khoản admin",
                    HttpStatus.FORBIDDEN,
                    "MANAGER_CANNOT_RESET_ADMIN_PASSWORD"
            );
        }
    }

    private void validateCanModifyStatus(
            User actor,
            User target,
            User.AccountStatus nextStatus
    ) {
        validateAdminOrManager(actor);

        if (actor.getUserId().equals(target.getUserId())
                && nextStatus != User.AccountStatus.active) {
            throw new AppException(
                    "Không thể tự khóa tài khoản đang đăng nhập",
                    HttpStatus.BAD_REQUEST,
                    "CANNOT_LOCK_SELF"
            );
        }

        if (actor.getRole() == User.Role.manager && target.getRole() == User.Role.admin) {
            throw new AppException(
                    "Manager không thể đổi trạng thái tài khoản admin",
                    HttpStatus.FORBIDDEN,
                    "MANAGER_CANNOT_MODIFY_ADMIN"
            );
        }
    }

    private void validateCanModifyRole(
            User actor,
            User target,
            User.Role nextRole
    ) {
        if (actor.getRole() != User.Role.admin) {
            throw new AppException(
                    "Chỉ admin mới có quyền đổi vai trò người dùng",
                    HttpStatus.FORBIDDEN,
                    "ONLY_ADMIN_CAN_CHANGE_ROLE"
            );
        }

        if (actor.getUserId().equals(target.getUserId()) && nextRole != target.getRole()) {
            throw new AppException(
                    "Không thể tự đổi vai trò của chính mình",
                    HttpStatus.BAD_REQUEST,
                    "CANNOT_CHANGE_SELF_ROLE"
            );
        }

        long adminCount = userRepo.countByRole(User.Role.admin);

        if (nextRole == User.Role.admin && target.getRole() != User.Role.admin) {
            if (adminCount > 0) {
                throw new AppException(
                        "Hệ thống chỉ cho phép có 1 tài khoản admin",
                        HttpStatus.BAD_REQUEST,
                        "ONLY_ONE_ADMIN_ALLOWED"
                );
            }
        }

        if (target.getRole() == User.Role.admin && nextRole != User.Role.admin) {
            if (adminCount <= 1) {
                throw new AppException(
                        "Không thể đổi vai trò của admin duy nhất",
                        HttpStatus.BAD_REQUEST,
                        "CANNOT_DEMOTE_ONLY_ADMIN"
                );
            }
        }
    }

    private void validateAdminOrManager(User actor) {
        if (actor.getRole() != User.Role.admin && actor.getRole() != User.Role.manager) {
            throw new AppException(
                    "Bạn không có quyền quản lý người dùng",
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN"
            );
        }
    }

    private void ensureEmailAvailable(String email, Integer currentUserId) {
        userRepo.findByEmail(email).ifPresent(existing -> {
            if (!existing.getUserId().equals(currentUserId)) {
                throw new AppException(
                        "Email đã được sử dụng",
                        HttpStatus.BAD_REQUEST,
                        "EMAIL_ALREADY_EXISTS"
                );
            }
        });
    }

    private void ensurePhoneAvailable(String phoneNumber, Integer currentUserId) {
        userRepo.findByPhoneNumber(phoneNumber).ifPresent(existing -> {
            if (!existing.getUserId().equals(currentUserId)) {
                throw new AppException(
                        "Số điện thoại đã được sử dụng",
                        HttpStatus.BAD_REQUEST,
                        "PHONE_ALREADY_EXISTS"
                );
            }
        });
    }

    private User findActor(String actorEmail) {
        String cleanEmail = normalizeText(actorEmail);

        if (cleanEmail == null) {
            throw new AppException(
                    "Phiên đăng nhập đã hết hạn",
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED"
            );
        }

        return userRepo.findByEmail(cleanEmail)
                .orElseThrow(() -> AppException.notFound("Tài khoản quản trị"));
    }

    private User findTarget(Integer userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private String generateTemporaryPassword(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder builder = new StringBuilder();

        for (int i = 0; i < length; i++) {
            int index = random.nextInt(TEMP_PASSWORD_CHARS.length());
            builder.append(TEMP_PASSWORD_CHARS.charAt(index));
        }

        return builder.toString();
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
