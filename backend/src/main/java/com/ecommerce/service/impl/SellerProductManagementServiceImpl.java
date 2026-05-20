package com.ecommerce.service.impl;

import com.ecommerce.dto.request.UpdateSellerProductRequest;
import com.ecommerce.dto.request.UpdateSellerProductStatusRequest;
import com.ecommerce.dto.request.UpdateSellerVariantStockRequest;
import com.ecommerce.dto.response.SellerProductResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.*;
import com.ecommerce.service.ImageStorageService;
import com.ecommerce.service.SellerProductManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SellerProductManagementServiceImpl
        implements SellerProductManagementService {

    private static final int MAX_IMAGES = 8;
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;
    private final ProductRepository productRepo;
    private final ProductVariantRepository variantRepo;
    private final ProductImageRepository imageRepo;
    private final CategoryRepository categoryRepo;
    private final BrandRepository brandRepo;
    private final ImageStorageService imageStorage;

    @Override
    @Transactional(readOnly = true)
    public Page<SellerProductResponse> getMyProducts(
            String email,
            String keyword,
            String status,
            int page,
            int size
    ) {
        Shop shop = findActiveShop(email);

        Product.Status productStatus = parseStatus(status);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50)
        );

        return productRepo.searchSellerProducts(
                shop,
                normalizeText(keyword),
                productStatus,
                pageable
        ).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerProductResponse getMyProductDetail(
            String email,
            Integer productId
    ) {
        Shop shop = findActiveShop(email);

        Product product = productRepo.findByProductIdAndShop(productId, shop)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));

        return toResponse(product);
    }

    @Override
    @Transactional
    public SellerProductResponse updateProduct(
            String email,
            Integer productId,
            UpdateSellerProductRequest request
    ) {
        Shop shop = findActiveShop(email);

        Product product = productRepo.findByProductIdAndShop(productId, shop)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));

        Product.Status nextStatus = request.getProductStatus();

        if (nextStatus == Product.Status.banned) {
            throw new AppException(
                    "Seller không thể tự đặt sản phẩm sang trạng thái bị khóa",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PRODUCT_STATUS"
            );
        }

        Category category = validateAndGetChildCategory(
                request.getParentCategoryId(),
                request.getCategoryId()
        );

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepo.findById(request.getBrandId())
                    .orElseThrow(() -> AppException.notFound("Thương hiệu"));
        }

        validateVariantPayloads(request.getVariants());

        product.setProductName(normalizeRequired(request.getProductName()));
        product.setDescription(normalizeText(request.getDescription()));
        product.setCategory(category);
        product.setBrand(brand);
        product.setProductStatus(nextStatus);

        syncVariants(product, request.getVariants());

        return toResponse(productRepo.save(product));
    }

    @Override
    @Transactional
    public SellerProductResponse updateProductStatus(
            String email,
            Integer productId,
            UpdateSellerProductStatusRequest request
    ) {
        Shop shop = findActiveShop(email);

        Product product = productRepo.findByProductIdAndShop(productId, shop)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));

        Product.Status nextStatus = request.getProductStatus();

        if (nextStatus == Product.Status.banned) {
            throw new AppException(
                    "Seller không thể tự đặt sản phẩm sang trạng thái bị khóa",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PRODUCT_STATUS"
            );
        }

        product.setProductStatus(nextStatus);

        return toResponse(productRepo.save(product));
    }

    @Override
    @Transactional
    public SellerProductResponse updateVariantStock(
            String email,
            Integer productId,
            Integer variantId,
            UpdateSellerVariantStockRequest request
    ) {
        Shop shop = findActiveShop(email);

        Product product = productRepo.findByProductIdAndShop(productId, shop)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));

        ProductVariant variant = variantRepo
                .findByVariantIdAndProduct(variantId, product)
                .orElseThrow(() -> AppException.notFound("Biến thể"));

        variant.setStockQuantity(request.getStockQuantity());
        variantRepo.save(variant);

        return toResponse(product);
    }

    @Override
    @Transactional
    public SellerProductResponse addProductImages(
            String email,
            Integer productId,
            List<MultipartFile> images
    ) {
        Shop shop = findActiveShop(email);

        Product product = productRepo.findByProductIdAndShop(productId, shop)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));

        List<ProductImage> currentImages =
                imageRepo.findByProductOrderByImageIdAsc(product);

        validateAddImages(currentImages.size(), images);

        boolean hasThumbnail = currentImages.stream()
                .anyMatch(image -> Boolean.TRUE.equals(image.getIsThumbnail()));

        List<ProductImage> newImages = new ArrayList<>();

        for (MultipartFile file : images) {
            ImageStorageService.UploadResult uploaded = imageStorage.uploadWithInfo(
                    file,
                    "products/shop-" + shop.getShopId()
            );

            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(uploaded.getUrl());
            image.setPublicId(uploaded.getPublicId());
            image.setCreatedAt(LocalDateTime.now());

            boolean shouldBeThumbnail =
                    !hasThumbnail && currentImages.isEmpty() && newImages.isEmpty();

            image.setIsThumbnail(shouldBeThumbnail);

            if (shouldBeThumbnail) {
                product.setThumbnailUrl(uploaded.getUrl());
            }

            newImages.add(image);
        }

        imageRepo.saveAll(newImages);

        if (product.getThumbnailUrl() == null || product.getThumbnailUrl().isBlank()) {
            ProductImage first = newImages.get(0);
            first.setIsThumbnail(true);
            product.setThumbnailUrl(first.getImageUrl());
            imageRepo.save(first);
        }

        return toResponse(productRepo.save(product));
    }

    @Override
    @Transactional
    public SellerProductResponse deleteProductImage(
            String email,
            Integer productId,
            Integer imageId
    ) {
        Shop shop = findActiveShop(email);

        Product product = productRepo.findByProductIdAndShop(productId, shop)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));

        List<ProductImage> images = imageRepo.findByProductOrderByImageIdAsc(product);

        if (images.size() <= 1) {
            throw new AppException(
                    "Sản phẩm cần ít nhất 1 ảnh",
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_IMAGE_REQUIRED"
            );
        }

        ProductImage target = imageRepo.findByImageIdAndProduct(imageId, product)
                .orElseThrow(() -> AppException.notFound("Ảnh sản phẩm"));

        boolean deletedThumbnail = Boolean.TRUE.equals(target.getIsThumbnail());
        String publicId = target.getPublicId();

        imageRepo.delete(target);
        product.getImages().removeIf(image -> image.getImageId().equals(imageId));

        images.removeIf(image -> image.getImageId().equals(imageId));

        if (publicId != null && !publicId.isBlank()) {
            imageStorage.delete(publicId);
        }

        if (deletedThumbnail && !images.isEmpty()) {
            ProductImage nextThumbnail = images.get(0);

            for (ProductImage image : images) {
                image.setIsThumbnail(image.getImageId().equals(nextThumbnail.getImageId()));
            }

            product.setThumbnailUrl(nextThumbnail.getImageUrl());
            imageRepo.saveAll(images);
        }

        return toResponse(productRepo.save(product));
    }

    @Override
    @Transactional
    public SellerProductResponse setProductThumbnail(
            String email,
            Integer productId,
            Integer imageId
    ) {
        Shop shop = findActiveShop(email);

        Product product = productRepo.findByProductIdAndShop(productId, shop)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));

        ProductImage target = imageRepo.findByImageIdAndProduct(imageId, product)
                .orElseThrow(() -> AppException.notFound("Ảnh sản phẩm"));

        List<ProductImage> images = imageRepo.findByProductOrderByImageIdAsc(product);

        for (ProductImage image : images) {
            image.setIsThumbnail(image.getImageId().equals(target.getImageId()));
        }

        product.setThumbnailUrl(target.getImageUrl());

        imageRepo.saveAll(images);

        return toResponse(productRepo.save(product));
    }

    private void syncVariants(
            Product product,
            List<UpdateSellerProductRequest.VariantPayload> payloads
    ) {
        for (UpdateSellerProductRequest.VariantPayload payload : payloads) {
            ProductVariant variant;

            if (payload.getVariantId() == null) {
                variant = new ProductVariant();
                variant.setProduct(product);
                variant.setCreatedAt(LocalDateTime.now());
                product.getVariants().add(variant);
            } else {
                variant = product.getVariants()
                        .stream()
                        .filter(v -> payload.getVariantId().equals(v.getVariantId()))
                        .findFirst()
                        .orElseThrow(() -> new AppException(
                                "Biến thể không thuộc sản phẩm này",
                                HttpStatus.BAD_REQUEST,
                                "INVALID_VARIANT"
                        ));
            }

            String sku = normalizeText(payload.getSku());
            validateSkuAvailable(sku, variant.getVariantId());

            variant.setVariantName(normalizeText(payload.getVariantName()));
            variant.setSku(sku);
            variant.setPrice(payload.getPrice());
            variant.setOriginalPrice(payload.getOriginalPrice());
            variant.setStockQuantity(defaultInt(payload.getStockQuantity()));
            variant.setWeight(defaultInt(payload.getWeight()));
            variant.setLength(defaultInt(payload.getLength()));
            variant.setWidth(defaultInt(payload.getWidth()));
            variant.setHeight(defaultInt(payload.getHeight()));
        }
    }

    private void validateVariantPayloads(
            List<UpdateSellerProductRequest.VariantPayload> variants
    ) {
        if (variants == null || variants.isEmpty()) {
            throw new AppException(
                    "Sản phẩm cần ít nhất 1 biến thể",
                    HttpStatus.BAD_REQUEST,
                    "VARIANT_REQUIRED"
            );
        }

        Set<String> requestSkus = new HashSet<>();

        for (UpdateSellerProductRequest.VariantPayload v : variants) {
            if (v.getPrice() == null || v.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(
                        "Giá bán phải lớn hơn 0",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_PRICE"
                );
            }

            if (v.getOriginalPrice() != null
                    && v.getOriginalPrice().compareTo(v.getPrice()) < 0) {
                throw new AppException(
                        "Giá gốc không được nhỏ hơn giá bán",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_ORIGINAL_PRICE"
                );
            }

            if (defaultInt(v.getStockQuantity()) < 0) {
                throw new AppException(
                        "Tồn kho không được âm",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_STOCK"
                );
            }

            if (
                    defaultInt(v.getWeight()) < 0 ||
                    defaultInt(v.getLength()) < 0 ||
                    defaultInt(v.getWidth()) < 0 ||
                    defaultInt(v.getHeight()) < 0
            ) {
                throw new AppException(
                        "Khối lượng/kích thước không được âm",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_DIMENSION"
                );
            }

            String sku = normalizeText(v.getSku());

            if (sku != null && !requestSkus.add(sku.toLowerCase())) {
                throw new AppException(
                        "SKU bị trùng trong danh sách biến thể",
                        HttpStatus.BAD_REQUEST,
                        "DUPLICATED_SKU"
                );
            }
        }
    }

    private void validateSkuAvailable(
            String sku,
            Integer currentVariantId
    ) {
        if (sku == null) {
            return;
        }

        variantRepo.findBySku(sku).ifPresent(existing -> {
            if (currentVariantId == null
                    || !existing.getVariantId().equals(currentVariantId)) {
                throw new AppException(
                        "SKU đã tồn tại",
                        HttpStatus.BAD_REQUEST,
                        "SKU_ALREADY_EXISTS"
                );
            }
        });
    }

    private void validateAddImages(
            int currentImageCount,
            List<MultipartFile> images
    ) {
        if (images == null || images.isEmpty()) {
            throw new AppException(
                    "Vui lòng chọn ít nhất 1 ảnh",
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_IMAGE_REQUIRED"
            );
        }

        if (currentImageCount + images.size() > MAX_IMAGES) {
            throw new AppException(
                    "Tối đa 8 ảnh sản phẩm",
                    HttpStatus.BAD_REQUEST,
                    "TOO_MANY_PRODUCT_IMAGES"
            );
        }

        for (MultipartFile file : images) {
            if (file == null || file.isEmpty()) {
                throw new AppException(
                        "Ảnh sản phẩm không hợp lệ",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_PRODUCT_IMAGE"
                );
            }

            String contentType = file.getContentType();

            if (contentType == null || !contentType.startsWith("image/")) {
                throw new AppException(
                        "Chỉ được upload file ảnh",
                        HttpStatus.BAD_REQUEST,
                        "INVALID_IMAGE_TYPE"
                );
            }

            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new AppException(
                        "Ảnh tối đa 5MB",
                        HttpStatus.BAD_REQUEST,
                        "IMAGE_TOO_LARGE"
                );
            }
        }
    }

    private Category validateAndGetChildCategory(
            Integer parentCategoryId,
            Integer childCategoryId
    ) {
        if (parentCategoryId == null || childCategoryId == null) {
            throw new AppException(
                    "Vui lòng chọn đầy đủ danh mục tổng và danh mục sản phẩm",
                    HttpStatus.BAD_REQUEST,
                    "CATEGORY_REQUIRED"
            );
        }

        if (parentCategoryId.equals(childCategoryId)) {
            throw new AppException(
                    "Danh mục sản phẩm không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_CHILD_CATEGORY"
            );
        }

        Category parent = categoryRepo.findById(parentCategoryId)
                .orElseThrow(() -> AppException.notFound("Danh mục tổng"));

        if (parent.getParentCategory() != null) {
            throw new AppException(
                    "Danh mục tổng không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PARENT_CATEGORY"
            );
        }

        Category child = categoryRepo.findById(childCategoryId)
                .orElseThrow(() -> AppException.notFound("Danh mục sản phẩm"));

        if (child.getParentCategory() == null) {
            throw new AppException(
                    "Vui lòng chọn danh mục sản phẩm",
                    HttpStatus.BAD_REQUEST,
                    "CHILD_CATEGORY_REQUIRED"
            );
        }

        Integer actualParentId = child.getParentCategory().getCategoryId();

        if (!parentCategoryId.equals(actualParentId)) {
            throw new AppException(
                    "Danh mục sản phẩm không thuộc danh mục tổng đã chọn",
                    HttpStatus.BAD_REQUEST,
                    "CATEGORY_MISMATCH"
            );
        }

        return child;
    }

    private Shop findActiveShop(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));

        SellerProfile seller = sellerRepo.findByUser(user)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa đăng ký seller",
                        HttpStatus.FORBIDDEN,
                        "NOT_SELLER"
                ));

        if (seller.getVerificationStatus() != SellerProfile.Status.approved) {
            throw new AppException(
                    "Hồ sơ seller chưa được duyệt",
                    HttpStatus.FORBIDDEN,
                    "SELLER_NOT_APPROVED"
            );
        }

        Shop shop = shopRepo.findBySeller(seller)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa tạo shop",
                        HttpStatus.NOT_FOUND,
                        "SHOP_NOT_FOUND"
                ));

        if (shop.getShopStatus() != Shop.Status.active) {
            throw new AppException(
                    "Shop không ở trạng thái hoạt động",
                    HttpStatus.FORBIDDEN,
                    "SHOP_NOT_ACTIVE"
            );
        }

        return shop;
    }

    private Product.Status parseStatus(String status) {
        String clean = normalizeText(status);

        if (clean == null || clean.equals("all")) {
            return null;
        }

        try {
            return Product.Status.valueOf(clean);
        } catch (IllegalArgumentException e) {
            throw new AppException(
                    "Trạng thái sản phẩm không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PRODUCT_STATUS"
            );
        }
    }

    private SellerProductResponse toResponse(Product p) {
        Category category = p.getCategory();
        Category parentCategory = category == null ? null : category.getParentCategory();

        return SellerProductResponse.builder()
                .productId(p.getProductId())
                .shopId(p.getShop() == null ? null : p.getShop().getShopId())

                .parentCategoryId(
                        parentCategory == null
                                ? null
                                : parentCategory.getCategoryId()
                )
                .parentCategoryName(
                        parentCategory == null
                                ? null
                                : parentCategory.getCategoryName()
                )

                .categoryId(
                        category == null
                                ? null
                                : category.getCategoryId()
                )
                .categoryName(
                        category == null
                                ? null
                                : category.getCategoryName()
                )

                .brandId(
                        p.getBrand() == null
                                ? null
                                : p.getBrand().getBrandId()
                )
                .brandName(
                        p.getBrand() == null
                                ? null
                                : p.getBrand().getBrandName()
                )

                .productName(p.getProductName())
                .description(p.getDescription())
                .thumbnailUrl(p.getThumbnailUrl())
                .productStatus(
                        p.getProductStatus() == null
                                ? null
                                : p.getProductStatus().name()
                )

                .soldCount(p.getSoldCount())
                .averageRating(p.getAverageRating())

                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())

                .variants(
                        p.getVariants()
                                .stream()
                                .sorted(Comparator.comparing(
                                        ProductVariant::getVariantId,
                                        Comparator.nullsLast(Integer::compareTo)
                                ))
                                .map(this::toVariantResponse)
                                .toList()
                )
                .images(
                        p.getImages()
                                .stream()
                                .sorted(Comparator.comparing(
                                        ProductImage::getImageId,
                                        Comparator.nullsLast(Integer::compareTo)
                                ))
                                .map(this::toImageResponse)
                                .toList()
                )
                .build();
    }

    private SellerProductResponse.VariantResponse toVariantResponse(
            ProductVariant v
    ) {
        return SellerProductResponse.VariantResponse.builder()
                .variantId(v.getVariantId())
                .sku(v.getSku())
                .variantName(v.getVariantName())
                .price(v.getPrice())
                .originalPrice(v.getOriginalPrice())
                .stockQuantity(v.getStockQuantity())
                .weight(v.getWeight())
                .length(v.getLength())
                .width(v.getWidth())
                .height(v.getHeight())
                .imageUrl(v.getImageUrl())
                .build();
    }

    private SellerProductResponse.ImageResponse toImageResponse(
            ProductImage image
    ) {
        return SellerProductResponse.ImageResponse.builder()
                .imageId(image.getImageId())
                .imageUrl(image.getImageUrl())
                .isThumbnail(image.getIsThumbnail())
                .build();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeText(value);

        return normalized == null ? "" : normalized;
    }

    private int defaultInt(Integer value) {
        return value == null ? 0 : value;
    }
}
