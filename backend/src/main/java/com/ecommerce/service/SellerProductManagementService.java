package com.ecommerce.service;

import com.ecommerce.dto.request.UpdateSellerProductRequest;
import com.ecommerce.dto.request.UpdateSellerProductStatusRequest;
import com.ecommerce.dto.request.UpdateSellerVariantStockRequest;
import com.ecommerce.dto.response.SellerProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SellerProductManagementService {

    Page<SellerProductResponse> getMyProducts(
            String email,
            String keyword,
            String status,
            int page,
            int size
    );

    SellerProductResponse getMyProductDetail(
            String email,
            Integer productId
    );

    SellerProductResponse updateProduct(
            String email,
            Integer productId,
            UpdateSellerProductRequest request
    );

    SellerProductResponse updateProductStatus(
            String email,
            Integer productId,
            UpdateSellerProductStatusRequest request
    );

    SellerProductResponse updateVariantStock(
            String email,
            Integer productId,
            Integer variantId,
            UpdateSellerVariantStockRequest request
    );

    SellerProductResponse addProductImages(
            String email,
            Integer productId,
            List<MultipartFile> images
    );

    SellerProductResponse deleteProductImage(
            String email,
            Integer productId,
            Integer imageId
    );

    SellerProductResponse setProductThumbnail(
            String email,
            Integer productId,
            Integer imageId
    );
}
