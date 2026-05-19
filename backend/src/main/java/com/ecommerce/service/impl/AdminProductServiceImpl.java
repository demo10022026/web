package com.ecommerce.service.impl;

import com.ecommerce.dto.request.AdminProductStatusRequest;
import com.ecommerce.dto.request.AdminProductUpdateRequest;
import com.ecommerce.dto.response.AdminProductDetailResponse;
import com.ecommerce.dto.response.AdminProductResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.BrandRepository;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.AdminProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminProductServiceImpl implements AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminProductResponse> getProducts(
            String keyword,
            Product.Status status,
            Integer shopId,
            Integer categoryId,
            Integer brandId,
            Pageable pageable
    ) {
        String cleanKeyword = normalizeKeyword(keyword);

        return productRepository
                .adminSearchProducts(cleanKeyword, status, shopId, categoryId, brandId, pageable)
                .map(this::toSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProductDetailResponse getProductDetail(Integer productId) {
        Product product = findProduct(productId);
        return toDetailResponse(product);
    }

    @Override
    @Transactional
    public AdminProductDetailResponse updateProduct(Integer productId, AdminProductUpdateRequest request) {
        Product product = findProduct(productId);

        if (request.getProductName() != null && !request.getProductName().isBlank()) {
            product.setProductName(request.getProductName().trim());
        }

        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }

        if (request.getThumbnailUrl() != null) {
            product.setThumbnailUrl(request.getThumbnailUrl());
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> AppException.notFound("Danh mục"));
            product.setCategory(category);
        }

        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> AppException.notFound("Thương hiệu"));
            product.setBrand(brand);
        }

        if (request.getProductStatus() != null) {
            product.setProductStatus(request.getProductStatus());
        }

        Product saved = productRepository.save(product);
        log.info("Admin cập nhật sản phẩm id={}", productId);

        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public AdminProductResponse updateStatus(Integer productId, AdminProductStatusRequest request) {
        Product product = findProduct(productId);
        product.setProductStatus(request.getProductStatus());

        Product saved = productRepository.save(product);

        log.info(
                "Admin đổi trạng thái sản phẩm id={} sang {}, reason={}",
                productId,
                request.getProductStatus(),
                request.getReason()
        );

        return toSummaryResponse(saved);
    }

    @Override
    @Transactional
    public AdminProductResponse softDelete(Integer productId) {
        Product product = findProduct(productId);
        product.setProductStatus(Product.Status.inactive);

        Product saved = productRepository.save(product);
        log.info("Admin xóa mềm sản phẩm id={}", productId);

        return toSummaryResponse(saved);
    }

    private Product findProduct(Integer productId) {
        return productRepository.adminFindById(productId)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return keyword.trim();
    }

    private AdminProductResponse toSummaryResponse(Product p) {
        Shop shop = p.getShop();
        Category category = p.getCategory();
        Brand brand = p.getBrand();

        List<ProductVariant> variants = safeVariants(p);
        int totalStock = variants.stream()
                .map(ProductVariant::getStockQuantity)
                .filter(q -> q != null)
                .mapToInt(Integer::intValue)
                .sum();

        return AdminProductResponse.builder()
                .productId(p.getProductId())
                .productName(p.getProductName())
                .thumbnailUrl(p.getThumbnailUrl())
                .productStatus(p.getProductStatus())

                .shopId(shop != null ? shop.getShopId() : null)
                .shopName(shop != null ? shop.getShopName() : null)

                .categoryId(category != null ? category.getCategoryId() : null)
                .categoryName(category != null ? category.getCategoryName() : null)

                .brandId(brand != null ? brand.getBrandId() : null)
                .brandName(brand != null ? brand.getBrandName() : null)

                .minPrice(getMinPrice(p))
                .originalPrice(getMinOriginalPrice(p))
                .discountPercent(getMaxDiscountPercent(p))

                .soldCount(p.getSoldCount())
                .averageRating(p.getAverageRating())

                .totalStock(totalStock)
                .variantCount(variants.size())
                .imageCount(safeImages(p).size())

                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private AdminProductDetailResponse toDetailResponse(Product p) {
        Shop shop = p.getShop();
        Category category = p.getCategory();
        Brand brand = p.getBrand();

        List<AdminProductDetailResponse.VariantInfo> variants = safeVariants(p)
                .stream()
                .map(v -> AdminProductDetailResponse.VariantInfo.builder()
                        .variantId(v.getVariantId())
                        .variantName(v.getVariantName())
                        .sku(v.getSku())
                        .price(v.getPrice())
                        .originalPrice(v.getOriginalPrice())
                        .discountPercent(v.getDiscountPercent())
                        .stockQuantity(v.getStockQuantity())
                        .weight(v.getWeight())
                        .length(v.getLength())
                        .width(v.getWidth())
                        .height(v.getHeight())
                        .imageUrl(v.getImageUrl())
                        .createdAt(v.getCreatedAt())
                        .build())
                .toList();

        List<AdminProductDetailResponse.ImageInfo> images = safeImages(p)
                .stream()
                .map(i -> AdminProductDetailResponse.ImageInfo.builder()
                        .imageId(i.getImageId())
                        .imageUrl(i.getImageUrl())
                        .isThumbnail(i.getIsThumbnail())
                        .createdAt(i.getCreatedAt())
                        .build())
                .toList();

        int totalStock = safeVariants(p).stream()
                .map(ProductVariant::getStockQuantity)
                .filter(q -> q != null)
                .mapToInt(Integer::intValue)
                .sum();

        return AdminProductDetailResponse.builder()
                .productId(p.getProductId())
                .productName(p.getProductName())
                .description(p.getDescription())
                .thumbnailUrl(p.getThumbnailUrl())
                .productStatus(p.getProductStatus())

                .shopId(shop != null ? shop.getShopId() : null)
                .shopName(shop != null ? shop.getShopName() : null)
                .shopSlug(shop != null ? shop.getShopSlug() : null)

                .categoryId(category != null ? category.getCategoryId() : null)
                .categoryName(category != null ? category.getCategoryName() : null)

                .brandId(brand != null ? brand.getBrandId() : null)
                .brandName(brand != null ? brand.getBrandName() : null)

                .soldCount(p.getSoldCount())
                .averageRating(p.getAverageRating())

                .minPrice(getMinPrice(p))
                .originalPrice(getMinOriginalPrice(p))
                .discountPercent(getMaxDiscountPercent(p))

                .totalStock(totalStock)

                .variants(variants)
                .images(images)

                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private List<ProductVariant> safeVariants(Product p) {
        return p.getVariants() == null ? List.of() : p.getVariants();
    }

    private List<ProductImage> safeImages(Product p) {
        return p.getImages() == null ? List.of() : p.getImages();
    }

    private BigDecimal getMinPrice(Product p) {
        if (safeVariants(p).isEmpty()) {
            return BigDecimal.ZERO;
        }
        return p.getMinPrice();
    }

    private BigDecimal getMinOriginalPrice(Product p) {
        if (safeVariants(p).isEmpty()) {
            return null;
        }
        return p.getMinOriginalPrice();
    }

    private int getMaxDiscountPercent(Product p) {
        if (safeVariants(p).isEmpty()) {
            return 0;
        }
        return p.getMaxDiscountPercent();
    }
}