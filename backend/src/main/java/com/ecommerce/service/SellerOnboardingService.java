package com.ecommerce.service;

import com.ecommerce.dto.request.ApplySellerRequest;
import com.ecommerce.dto.response.SellerProfileResponse;
import com.ecommerce.entity.SellerDocument;
import org.springframework.web.multipart.MultipartFile;

public interface SellerOnboardingService {

    SellerProfileResponse apply(String userEmail, ApplySellerRequest request);

    SellerProfileResponse.DocumentResponse uploadDocument(
            String userEmail,
            SellerDocument.DocType docType,
            MultipartFile file);

    SellerProfileResponse getMyProfile(String userEmail);
}
