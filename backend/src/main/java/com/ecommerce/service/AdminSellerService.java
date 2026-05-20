package com.ecommerce.service;

import com.ecommerce.dto.request.AdminReviewSellerRequest;
import com.ecommerce.dto.request.AdminSuspendSellerRequest;
import com.ecommerce.dto.response.AdminSellerResponse;
import com.ecommerce.dto.response.AdminSellerStatsResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AdminSellerService {

    AdminSellerStatsResponse getStats();

    Page<AdminSellerResponse> listSellers(
            String status,
            String keyword,
            int page,
            int size
    );

    AdminSellerResponse getSellerDetail(Integer sellerId);

    AdminSellerResponse reviewSeller(
            Integer sellerId,
            AdminReviewSellerRequest request
    );

    AdminSellerResponse suspendSeller(
            Integer sellerId,
            AdminSuspendSellerRequest request
    );

    AdminSellerResponse reactivateSeller(Integer sellerId);

    List<AdminSellerResponse> getPendingSellersLegacy();

    AdminSellerResponse approveSellerLegacy(Integer sellerId);

    AdminSellerResponse rejectSellerLegacy(
            Integer sellerId,
            String reason
    );
}
