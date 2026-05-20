package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminUserStatsResponse {

    private long totalUsers;

    private long activeUsers;

    private long suspendedUsers;

    private long bannedUsers;

    private long normalUsers;

    private long sellerUsers;

    private long adminUsers;

    private long managerUsers;
}
