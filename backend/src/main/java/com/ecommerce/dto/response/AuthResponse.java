package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private UserInfo user;

    @Getter @Builder
    public static class UserInfo {
        private Integer userId;
        private String username;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String avatarUrl;
        private String role;
        private Boolean emailVerified;
        private Boolean phoneVerified;
    }
}
