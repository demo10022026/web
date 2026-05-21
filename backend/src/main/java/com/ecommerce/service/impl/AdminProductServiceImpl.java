package com.ecommerce.service.impl;

import com.ecommerce.dto.request.AdminProductStatusRequest;
import com.ecommerce.dto.request.AdminProductUpdateRequest;
import com.ecommerce.dto.response.AdminProductDetailResponse;
import com.ecommerce.dto.response.AdminProductResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.BrandRepository;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.FlashSaleRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.AdminProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminProductServiceImpl implements AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final FlashSaleRepository flashSaleRepository;

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
    public AdminProductDetailResponse updateProduct(
            Integer productId,
            AdminProductUpdateRequest request
    ) {
        Product product = findProduct(productId);

        if (request.getProductName() != null && !request.getProductName().isBlank()) {
            product.setProductName(request.getProductName().trim());
        }

        if (request.getDescription() != null) {
            product.setDescription(normalizeText(request.getDescription()));
        }

        /*
         * Admin UI hiện đã để Thumbnail URL chỉ xem.
         * Không update thumbnailUrl ở đây để tránh sửa ảnh đại diện bằng URL thủ công.
         */

        if (
                hasText(request.getParentCategoryName()) ||
                        hasText(request.getCategoryName())
        ) {
            Category category = resolveOrCreateCategory(
                    request.getParentCategoryName(),
                    request.getCategoryName()
            );

            product.setCategory(category);
        }

        product.setBrand(resolveBrandByName(request.getBrandName()));

        if (request.getProductStatus() != null) {
            product.setProductStatus(request.getProductStatus());
        }

        product.setUpdatedAt(LocalDateTime.now());

        Product saved = productRepository.save(product);

        log.info("Admin cập nhật sản phẩm id={}", productId);

        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public AdminProductResponse updateStatus(
            Integer productId,
            AdminProductStatusRequest request
    ) {
        Product product = findProduct(productId);
        product.setProductStatus(request.getProductStatus());
        product.setUpdatedAt(LocalDateTime.now());

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
        product.setUpdatedAt(LocalDateTime.now());

        Product saved = productRepository.save(product);

        log.info("Admin xóa mềm sản phẩm id={}", productId);

        return toSummaryResponse(saved);
    }

    @Override
    @Transactional
    public void permanentDelete(Integer productId) {
        Product product = findProduct(productId);

        flashSaleRepository.deleteByProductId(productId);
        productRepository.delete(product);

        log.warn("Admin xóa vĩnh viễn sản phẩm id={}", productId);
    }

    private Product findProduct(Integer productId) {
        return productRepository.adminFindById(productId)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));
    }

    private Category resolveOrCreateCategory(
            String rawParentCategoryName,
            String rawCategoryName
    ) {
        String parentCategoryName = normalizeText(rawParentCategoryName);
        String categoryName = normalizeText(rawCategoryName);

        if (parentCategoryName == null) {
            throw new AppException(
                    "Danh mục tổng không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "PARENT_CATEGORY_REQUIRED"
            );
        }

        if (categoryName == null) {
            throw new AppException(
                    "Danh mục sản phẩm không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "CATEGORY_REQUIRED"
            );
        }

        if (parentCategoryName.length() > 100) {
            throw new AppException(
                    "Danh mục tổng tối đa 100 ký tự",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PARENT_CATEGORY_NAME"
            );
        }

        if (categoryName.length() > 100) {
            throw new AppException(
                    "Danh mục sản phẩm tối đa 100 ký tự",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_CATEGORY_NAME"
            );
        }

        if (parentCategoryName.equalsIgnoreCase(categoryName)) {
            throw new AppException(
                    "Danh mục sản phẩm không được trùng với danh mục tổng",
                    HttpStatus.BAD_REQUEST,
                    "CATEGORY_NAME_DUPLICATED"
            );
        }

        Category parentCategory = resolveOrCreateParentCategory(parentCategoryName);

        return resolveOrCreateChildCategory(categoryName, parentCategory);
    }

    private Category resolveOrCreateParentCategory(String parentCategoryName) {
        return categoryRepository
                .findByCategoryNameIgnoreCaseAndParentCategoryIsNull(parentCategoryName)
                .orElseGet(() -> {
                    categoryRepository.findByCategoryNameIgnoreCase(parentCategoryName)
                            .ifPresent(existing -> {
                                throw new AppException(
                                        "Tên danh mục tổng đã tồn tại ở danh mục con",
                                        HttpStatus.BAD_REQUEST,
                                        "PARENT_CATEGORY_NAME_EXISTS_AS_CHILD"
                                );
                            });

                    Category category = new Category();
                    category.setCategoryName(parentCategoryName);
                    category.setParentCategory(null);
                    category.setCreatedAt(LocalDateTime.now());

                    return categoryRepository.save(category);
                });
    }

    private Category resolveOrCreateChildCategory(
            String categoryName,
            Category parentCategory
    ) {
        return categoryRepository
                .findByCategoryNameIgnoreCaseAndParentCategory_CategoryId(
                        categoryName,
                        parentCategory.getCategoryId()
                )
                .orElseGet(() -> {
                    categoryRepository.findByCategoryNameIgnoreCase(categoryName)
                            .ifPresent(existing -> {
                                throw new AppException(
                                        "Tên danh mục sản phẩm đã tồn tại ở danh mục khác",
                                        HttpStatus.BAD_REQUEST,
                                        "CATEGORY_NAME_EXISTS_IN_OTHER_PARENT"
                                );
                            });

                    Category category = new Category();
                    category.setCategoryName(categoryName);
                    category.setParentCategory(parentCategory);
                    category.setCreatedAt(LocalDateTime.now());

                    return categoryRepository.save(category);
                });
    }

    private Brand resolveBrandByName(String brandName) {
        String cleanName = normalizeText(brandName);

        if (cleanName == null) {
            return null;
        }

        if (cleanName.length() > 100) {
            throw new AppException(
                    "Tên thương hiệu tối đa 100 ký tự",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_BRAND_NAME"
            );
        }

        return brandRepository.findByBrandNameIgnoreCase(cleanName)
                .map(existingBrand -> {
                    if (existingBrand.getBrandStatus() != Brand.Status.active) {
                        existingBrand.setBrandStatus(Brand.Status.active);
                        return brandRepository.save(existingBrand);
                    }

                    return existingBrand;
                })
                .orElseGet(() -> brandRepository.save(
                        Brand.builder()
                                .brandName(cleanName)
                                .brandStatus(Brand.Status.active)
                                .build()
                ));
    }

    private String normalizeKeyword(String keyword) {
        return normalizeText(keyword);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private AdminProductResponse toSummaryResponse(Product p) {
        Shop shop = p.getShop();
        Category category = p.getCategory();
        Category parentCategory = category == null ? null : category.getParentCategory();
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