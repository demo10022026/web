package com.ecommerce.service;

import com.ecommerce.dto.request.SellerReviewRequest;
import com.ecommerce.dto.response.AdminSellerResponse;
import com.ecommerce.entity.SellerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminSellerService {

    Page<AdminSellerResponse> getSellers(
            SellerProfile.Status status,
            Pageable pageable
    );

    AdminSellerResponse getSellerDetail(Integer sellerId);

    AdminSellerResponse reviewSeller(
            Integer sellerId,
            SellerReviewRequest request
    );
}