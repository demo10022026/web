package com.ecommerce.service;

import com.ecommerce.dto.request.CreateSellerProductRequest;
import com.ecommerce.dto.response.SellerProductOptionsResponse;
import com.ecommerce.dto.response.SellerProductResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SellerProductService {

    SellerProductOptionsResponse getCreateOptions();

    SellerProductResponse createProduct(
            String email,
            CreateSellerProductRequest request,
            List<MultipartFile> images
    );
}