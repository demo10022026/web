package com.ecommerce.service;

import com.ecommerce.dto.response.SellerAnalyticsResponse;

import java.time.LocalDate;

public interface SellerAnalyticsService {

    SellerAnalyticsResponse getMyShopAnalytics(
            String email,
            LocalDate fromDate,
            LocalDate toDate
    );
}
