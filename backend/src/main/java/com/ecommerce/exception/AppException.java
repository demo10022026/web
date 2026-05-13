package com.ecommerce.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public AppException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    // --- Auth errors ---
    public static AppException emailAlreadyExists() {
        return new AppException("Email đã được sử dụng", HttpStatus.CONFLICT, "EMAIL_EXISTS");
    }

    public static AppException usernameAlreadyExists() {
        return new AppException("Username đã tồn tại", HttpStatus.CONFLICT, "USERNAME_EXISTS");
    }

    public static AppException phoneAlreadyExists() {
        return new AppException("Số điện thoại đã được sử dụng", HttpStatus.CONFLICT, "PHONE_EXISTS");
    }

    public static AppException invalidCredentials() {
        return new AppException("Email hoặc mật khẩu không đúng", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    public static AppException tokenExpired() {
        return new AppException("Token đã hết hạn", HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED");
    }

    public static AppException tokenInvalid() {
        return new AppException("Token không hợp lệ", HttpStatus.UNAUTHORIZED, "TOKEN_INVALID");
    }

    public static AppException accountSuspended() {
        return new AppException("Tài khoản đã bị tạm khóa", HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED");
    }

    // --- Resource errors ---
    public static AppException notFound(String resource) {
        return new AppException(resource + " không tồn tại", HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public static AppException forbidden() {
        return new AppException("Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN, "FORBIDDEN");
    }
}
