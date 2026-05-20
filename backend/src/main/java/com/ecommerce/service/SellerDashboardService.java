package com.ecommerce.service;

import com.ecommerce.dto.response.SellerDashboardResponse;

public interface SellerDashboardService {

    SellerDashboardResponse getDashboard(String email);
}