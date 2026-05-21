package com.ecommerce.service;

import com.ecommerce.dto.request.CreateSellerProductRequest;
import com.ecommerce.dto.request.UpdateSellerProductRequest;
import com.ecommerce.dto.response.SellerProductOptionsResponse;
import com.ecommerce.dto.response.SellerProductResponse;
import com.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SellerProductService {

    SellerProductOptionsResponse getCreateOptions();

    Page<SellerProductResponse> getMyProducts(
            String email,
            String keyword,
            Product.Status status,
            int page,
            int size
    );

    SellerProductResponse getMyProductDetail(
            String email,
            Integer productId
    );

    SellerProductResponse createProduct(
            String email,
            CreateSellerProductRequest request,
            List<MultipartFile> images
    );

    SellerProductResponse updateProduct(
            String email,
            Integer productId,
            UpdateSellerProductRequest request
    );

    SellerProductResponse updateProductStatus(
            String email,
            Integer productId,
            Product.Status productStatus
    );

    SellerProductResponse updateVariantStock(
            String email,
            Integer productId,
            Integer variantId,
            Integer stockQuantity
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