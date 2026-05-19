package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;
import java.util.List;

@Getter @Builder
public class NewUsersResponse {
    private long                        totalCount;
    private long                        compareCount;   // kỳ trước (cùng độ dài)
    private double                      changePercent;  // % thay đổi
    private List<DashboardResponse.DailyCount> trend;  // từng ngày trong range
    private LocalDate                   from;
    private LocalDate                   to;
}