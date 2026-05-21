package com.ecommerce.service.impl;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.*;
import com.ecommerce.security.JwtUtil;
import com.ecommerce.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    // =========================================================
    // REGISTER
    // =========================================================
    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw AppException.emailAlreadyExists();
        if (userRepository.existsByUsername(request.getUsername()))
            throw AppException.usernameAlreadyExists();
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber()))
            throw AppException.phoneAlreadyExists();

        User user = User.builder()
                .username(request.getUsername())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.user)
                .accountStatus(User.AccountStatus.active)
                .build();

        userRepository.save(user);

        // Gửi OTP xác thực email sau khi đăng ký
        otpService.sendOtp(user.getEmail(), OtpCode.Purpose.EMAIL_VERIFY);

        return buildAuthResponse(user);
    }

    // =========================================================
    // LOGIN
    // =========================================================
    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(AppException::invalidCredentials);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw AppException.invalidCredentials();
        }

        if (!user.isActive()) {
            throw AppException.accountSuspended();
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        refreshTokenRepository.deleteAllByUser(user);
        return buildAuthResponse(user);
    }

    // =========================================================
    // REFRESH TOKEN
    // =========================================================
    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken rt = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(AppException::tokenInvalid);

        if (rt.isExpired()) {
            refreshTokenRepository.delete(rt);
            throw AppException.tokenExpired();
        }

        User user = rt.getUser();
        String newAccess = jwtUtil.generateAccessToken(user.getEmail());
        refreshTokenRepository.delete(rt);
        RefreshToken newRt = createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(newAccess)
                .refreshToken(newRt.getToken())
                .tokenType("Bearer")
                .user(mapUserInfo(user))
                .build();
    }

    // =========================================================
    // LOGOUT
    // =========================================================
    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }

    // =========================================================
    // EMAIL VERIFICATION
    // =========================================================
    @Override
    public void sendEmailVerifyOtp(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Email"));
        otpService.sendOtp(email, OtpCode.Purpose.EMAIL_VERIFY);
    }

    @Override
    @Transactional
    public void verifyEmail(String email, String otp) {
        otpService.verifyOtp(email, otp, OtpCode.Purpose.EMAIL_VERIFY);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    // =========================================================
    // FORGOT PASSWORD
    // =========================================================
    @Override
    public void sendForgotPasswordOtp(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Email"));
        otpService.sendOtp(email, OtpCode.Purpose.FORGOT_PASSWORD);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp(),
                OtpCode.Purpose.FORGOT_PASSWORD);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> AppException.notFound("User"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Xóa tất cả refresh token → bắt buộc đăng nhập lại
        refreshTokenRepository.deleteAllByUser(user);
        log.info("Đã reset password cho: {}", user.getEmail());
    }

    // =========================================================
    // CHANGE PASSWORD (có OTP xác nhận)
    // =========================================================
    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
            throw new AppException("Mật khẩu hiện tại không đúng",
                    org.springframework.http.HttpStatus.BAD_REQUEST, "WRONG_PASSWORD");

        otpService.verifyOtp(email, request.getOtp(), OtpCode.Purpose.EMAIL_VERIFY);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.deleteAllByUser(user);
    }

    // =========================================================
    // HELPERS
    // =========================================================
    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(user.getEmail()))
                .refreshToken(createRefreshToken(user).getToken())
                .tokenType("Bearer")
                .user(mapUserInfo(user))
                .build();
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .build();
        return refreshTokenRepository.save(token);
    }

    private AuthResponse.UserInfo mapUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .emailVerified(user.getEmailVerified())
                .phoneVerified(user.getPhoneVerified())
                .build();
    }
}
