package com.ecommerce.service;

import com.ecommerce.dto.request.AdminProductStatusRequest;
import com.ecommerce.dto.request.AdminProductUpdateRequest;
import com.ecommerce.dto.response.AdminProductDetailResponse;
import com.ecommerce.dto.response.AdminProductResponse;
import com.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminProductService {

    Page<AdminProductResponse> getProducts(
            String keyword,
            Product.Status status,
            Integer shopId,
            Integer categoryId,
            Integer brandId,
            Pageable pageable
    );

    AdminProductDetailResponse getProductDetail(Integer productId);

    AdminProductDetailResponse updateProduct(Integer productId, AdminProductUpdateRequest request);

    AdminProductResponse updateStatus(Integer productId, AdminProductStatusRequest request);

    AdminProductResponse softDelete(Integer productId);
}