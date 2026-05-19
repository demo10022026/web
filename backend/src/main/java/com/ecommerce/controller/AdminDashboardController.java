package com.ecommerce.controller;

import com.ecommerce.dto.response.DashboardResponse;
import com.ecommerce.dto.response.NewUsersResponse;
import com.ecommerce.service.impl.AdminDashboardServiceImpl;
import com.ecommerce.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin — Dashboard")
public class AdminDashboardController {

    private final AdminDashboardServiceImpl service;

    /**
     * GET /api/admin/dashboard
     * Tổng quan: stats, top products, trend 30 ngày, sellers chờ duyệt
     */
    @GetMapping
    @Operation(summary = "Tổng quan dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(service.getDashboard()));
    }

    /**
     * GET /api/admin/dashboard/new-users?from=2024-01-01&to=2024-01-31
     * Người dùng mới theo khoảng thời gian tuỳ chọn
     */
    @GetMapping("/new-users")
    @Operation(summary = "Người dùng mới theo khoảng thời gian")
    public ResponseEntity<ApiResponse<NewUsersResponse>> getNewUsers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        if (from.isAfter(to)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("from phải nhỏ hơn to", "INVALID_RANGE"));
        }
        return ResponseEntity.ok(ApiResponse.success(service.getNewUsers(from, to)));
    }
}