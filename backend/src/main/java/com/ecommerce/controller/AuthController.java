package com.ecommerce.controller;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.service.AuthService;
import com.ecommerce.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công. Vui lòng xác thực email.",
                        authService.register(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Đăng nhập thành công", authService.login(request)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refreshToken(request)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Đã đăng xuất", null));
    }

    // ---- Email verification ----

    @PostMapping("/send-verify-email")
    @Operation(summary = "Gửi OTP xác thực email")
    public ResponseEntity<ApiResponse<Void>> sendVerifyEmail(
            @RequestBody Map<String, String> body) {
        authService.sendEmailVerifyOtp(body.get("email"));
        return ResponseEntity.ok(ApiResponse.success("Đã gửi OTP vào email", null));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Xác thực email bằng OTP")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @RequestBody Map<String, String> body) {
        authService.verifyEmail(body.get("email"), body.get("otp"));
        return ResponseEntity.ok(ApiResponse.success("Xác thực email thành công", null));
    }

    // ---- Forgot password ----

    @PostMapping("/forgot-password")
    @Operation(summary = "Gửi OTP quên mật khẩu")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @RequestBody Map<String, String> body) {
        authService.sendForgotPasswordOtp(body.get("email"));
        return ResponseEntity.ok(ApiResponse.success(
                "Đã gửi mã OTP vào email " + body.get("email"), null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu bằng OTP")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.", null));
    }

    // ---- Change password (cần đăng nhập) ----

    @PostMapping("/change-password")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Đổi mật khẩu (cần OTP xác nhận)")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(
                "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.", null));
    }
}
