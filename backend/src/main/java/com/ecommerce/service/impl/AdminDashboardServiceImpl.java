package com.ecommerce.service.impl;

import com.ecommerce.dto.response.DashboardResponse;
import com.ecommerce.dto.response.NewUsersResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.SellerProfile;
import com.ecommerce.repository.AdminDashboardRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl {

    private final AdminDashboardRepository dashRepo;
    private final SellerRepository sellerRepo;
    private final ProductRepository productRepo;
    private final OrderRepository orderRepo;

    // ─────────────────────────────────────────────────────────
    // Dashboard tổng quan
    // ─────────────────────────────────────────────────────────
    public DashboardResponse getDashboard() {

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();

        LocalDateTime weekStart = now.toLocalDate()
                .with(DayOfWeek.MONDAY)
                .atStartOfDay();

        LocalDateTime monthStart = now.toLocalDate()
                .withDayOfMonth(1)
                .atStartOfDay();

        LocalDateTime thirtyDaysAgo = todayStart.minusDays(29);

        // ── Tổng quan ───────────────────────────────────────

        long totalUsers = dashRepo.countTotalUsers();

        long totalSellers = sellerRepo.count();

        long totalProducts = productRepo.count();

        long totalOrders = orderRepo.count();

        long pendingSellerCount =
                sellerRepo.findByVerificationStatus(
                        SellerProfile.Status.pending,
                        PageRequest.of(0, 1)
                ).getTotalElements();

        long approvedSellerCount =
                sellerRepo.findByVerificationStatus(
                        SellerProfile.Status.approved,
                        PageRequest.of(0, 1)
                ).getTotalElements();

        // ── Tổng doanh thu ─────────────────────────────────

        BigDecimal totalRevenue = orderRepo.findAll()
                .stream()
                .filter(order ->
                        order.getOrderStatus() != Order.OrderStatus.cancelled
                                && order.getOrderStatus() != Order.OrderStatus.returned
                )
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Người dùng mới ────────────────────────────────

        long newToday = dashRepo.countNewUsers(todayStart, now);

        long newWeek = dashRepo.countNewUsers(weekStart, now);

        long newMonth = dashRepo.countNewUsers(monthStart, now);

        // ── Trend 30 ngày ─────────────────────────────────

        List<DashboardResponse.DailyCount> trend =
                buildTrend(thirtyDaysAgo, now);

        // ── Seller chờ duyệt gần nhất ─────────────────────

        List<DashboardResponse.PendingSellerItem> pending =
                sellerRepo.findByVerificationStatus(
                                SellerProfile.Status.pending,
                                PageRequest.of(
                                        0,
                                        5,
                                        Sort.by("createdAt").descending()
                                )
                        )
                        .stream()
                        .map(s -> DashboardResponse.PendingSellerItem.builder()
                                .sellerId(s.getSellerId())
                                .fullName(
                                        s.getUser() != null
                                                ? s.getUser().getFullName()
                                                : "Unknown"
                                )
                                .email(
                                        s.getUser() != null
                                                ? s.getUser().getEmail()
                                                : "Unknown"
                                )
                                .identityNumber(s.getIdentityNumber())

                                .verificationStatus(
                                        s.getVerificationStatus() != null
                                                ? s.getVerificationStatus().name()
                                                : "pending"
                                )

                                .documentCount(0)

                                .createdAt(
                                        s.getCreatedAt() != null
                                                ? s.getCreatedAt().toString()
                                                : null
                                )

                                .build())
                        .collect(Collectors.toList());

        // ── Top sản phẩm ──────────────────────────────────

        List<DashboardResponse.TopProduct> topQty =
                mapTopProducts(
                        dashRepo.findTopProductsByQuantity(10)
                );

        List<DashboardResponse.TopProduct> topRev =
                mapTopProducts(
                        dashRepo.findTopProductsByRevenue(10)
                );

        // ── Response ──────────────────────────────────────

        return DashboardResponse.builder()

                .totalUsers(totalUsers)
                .totalSellers(totalSellers)
                .approvedSellerCount(approvedSellerCount)
                .pendingSellerCount(pendingSellerCount)

                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)

                .newUsersToday(newToday)
                .newUsersThisWeek(newWeek)
                .newUsersThisMonth(newMonth)

                .newUsersTrend(trend)

                .recentPendingSellers(pending)

                .topByQuantity(topQty)
                .topByRevenue(topRev)

                .build();
    }

    // ─────────────────────────────────────────────────────────
    // Người dùng mới theo khoảng thời gian
    // ─────────────────────────────────────────────────────────
    public NewUsersResponse getNewUsers(
            LocalDate from,
            LocalDate to
    ) {

        LocalDateTime start = from.atStartOfDay();

        LocalDateTime end = to.atTime(LocalTime.MAX);

        long days =
                to.toEpochDay() - from.toEpochDay() + 1;

        // ── Kỳ hiện tại ───────────────────────────────────

        long current =
                dashRepo.countNewUsers(start, end);

        // ── Kỳ trước ──────────────────────────────────────

        LocalDateTime prevStart =
                start.minusDays(days);

        LocalDateTime prevEnd =
                start.minusNanos(1);

        long previous =
                dashRepo.countNewUsers(prevStart, prevEnd);

        // ── % thay đổi ────────────────────────────────────

        double change;

        if (previous == 0) {
            change = 100.0;
        } else {
            change = Math.round(
                    ((double) (current - previous) / previous) * 1000
            ) / 10.0;
        }

        // ── Trend ─────────────────────────────────────────

        List<DashboardResponse.DailyCount> trend =
                buildTrend(start, end);

        return NewUsersResponse.builder()
                .totalCount(current)
                .compareCount(previous)
                .changePercent(change)
                .trend(trend)
                .from(from)
                .to(to)
                .build();
    }

    // ─────────────────────────────────────────────────────────
    // Trend helper
    // ─────────────────────────────────────────────────────────
    private List<DashboardResponse.DailyCount> buildTrend(
            LocalDateTime from,
            LocalDateTime to
    ) {

        List<Object[]> rows =
                dashRepo.countNewUsersByDay(from, to);

        Map<LocalDate, Long> map = new LinkedHashMap<>();

        for (Object[] row : rows) {

            LocalDate date =
                    ((Date) row[0]).toLocalDate();

            long count =
                    ((Number) row[1]).longValue();

            map.put(date, count);
        }

        List<DashboardResponse.DailyCount> result =
                new ArrayList<>();

        LocalDate cursor = from.toLocalDate();

        LocalDate last = to.toLocalDate();

        while (!cursor.isAfter(last)) {

            result.add(
                    DashboardResponse.DailyCount.builder()
                            .date(cursor)
                            .count(
                                    map.getOrDefault(cursor, 0L)
                            )
                            .build()
            );

            cursor = cursor.plusDays(1);
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────
    // Map top products
    // ─────────────────────────────────────────────────────────
    private List<DashboardResponse.TopProduct> mapTopProducts(
            List<Object[]> rows
    ) {

        AtomicInteger rank = new AtomicInteger(1);

        return rows.stream()
                .map(r -> DashboardResponse.TopProduct.builder()

                        .rank(rank.getAndIncrement())

                        .productId(
                                ((Number) r[0]).intValue()
                        )

                        .productName((String) r[1])

                        .thumbnailUrl((String) r[2])

                        .shopName((String) r[3])

                        .categoryName(
                                r[4] != null
                                        ? (String) r[4]
                                        : "—"
                        )

                        .totalQuantity(
                                ((Number) r[5]).longValue()
                        )

                        .totalRevenue(
                                new BigDecimal(r[6].toString())
                        )

                        .build())
                .collect(Collectors.toList());
    }
}