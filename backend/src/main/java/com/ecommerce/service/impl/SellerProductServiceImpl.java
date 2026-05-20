package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CreateSellerProductRequest;
import com.ecommerce.dto.response.SellerProductOptionsResponse;
import com.ecommerce.dto.response.SellerProductResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.*;
import com.ecommerce.service.ImageStorageService;
import com.ecommerce.service.SellerProductService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerProductServiceImpl implements SellerProductService {

    private static final int MAX_IMAGES = 8;
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final BrandRepository brandRepo;

    private final ImageStorageService imageStorage;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public SellerProductOptionsResponse getCreateOptions() {
        List<SellerProductOptionsResponse.CategoryOption> categories =
                categoryRepo.findAll()
                        .stream()
                        .map(c -> SellerProductOptionsResponse.CategoryOption.builder()
                                .categoryId(c.getCategoryId())
                                .categoryName(c.getCategoryName())
                                .parentCategoryId(
                                        c.getParentCategory() == null
                                                ? null
                                                : c.getParentCategory().getCategoryId()
                                )
                                .build())
                        .toList();

        List<SellerProductOptionsResponse.BrandOption> brands =
                brandRepo.findByBrandStatus(Brand.Status.active)
                        .stream()
                        .map(b -> SellerProductOptionsResponse.BrandOption.builder()
                                .brandId(b.getBrandId())
                                .brandName(b.getBrandName())
                                .build())
                        .toList();

        return SellerProductOptionsResponse.builder()
                .categories(categories)
                .brands(brands)
                .build();
    }

    @Override
    @Transactional
    public SellerProductResponse createProduct(
            String email,
            CreateSellerProductRequest request,
            List<MultipartFile> images
    ) {
        Shop shop = findActiveShop(email);

        Category category = validateAndGetChildCategory(
                request.getParentCategoryId(),
                request.getCategoryId()
        );

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepo.findById(request.getBrandId())
                    .orElseThrow(() -> AppException.notFound("Thương hiệu"));
        }

        List<CreateSellerProductRequest.VariantPayload> variantPayloads =
                parseVariants(request.getVariantsJson());

        validateVariants(variantPayloads);
        validateImages(images);

        Product product = new Product();
        product.setShop(shop);
        product.setCategory(category);
        product.setBrand(brand);
        product.setProductName(request.getProductName().trim());
        product.setDescription(normalizeText(request.getDescription()));
        product.setProductStatus(
                request.getProductStatus() == null
                        ? Product.Status.active
                        : request.getProductStatus()
        );
        product.setSoldCount(0);
        product.setAverageRating(BigDecimal.ZERO);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        List<ImageStorageService.UploadResult> uploadedImages =
                uploadProductImages(shop, images);

        int thumbnailIndex = normalizeThumbnailIndex(
                request.getThumbnailIndex(),
                uploadedImages.size()
        );

        product.setThumbnailUrl(uploadedImages.get(thumbnailIndex).getUrl());

        for (CreateSellerProductRequest.VariantPayload payload : variantPayloads) {
            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setVariantName(normalizeText(payload.getVariantName()));
            variant.setSku(normalizeText(payload.getSku()));
            variant.setPrice(payload.getPrice());
            variant.setOriginalPrice(payload.getOriginalPrice());
            variant.setStockQuantity(defaultInt(payload.getStockQuantity()));
            variant.setWeight(defaultInt(payload.getWeight()));
            variant.setLength(defaultInt(payload.getLength()));
            variant.setWidth(defaultInt(payload.getWidth()));
            variant.setHeight(defaultInt(payload.getHeight()));
            variant.setCreatedAt(LocalDateTime.now());

            product.getVariants().add(variant);
        }

        for (int i = 0; i < uploadedImages.size(); i++) {
            ImageStorageService.UploadResult uploaded = uploadedImages.get(i);

            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(uploaded.getUrl());
            image.setPublicId(uploaded.getPublicId());
            image.setIsThumbnail(i == thumbnailIndex);
            image.setCreatedAt(LocalDateTime.now());

            product.getImages().add(image);
        }

        Product saved = productRepo.save(product);

        return toResponse(saved);
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

    private List<CreateSellerProductRequest.VariantPayload> parseVariants(
            String variantsJson
    ) {
        try {
            List<CreateSellerProductRequest.VariantPayload> variants =
                    objectMapper.readValue(
                            variantsJson,
                            new TypeReference<>() {}
                    );

            if (variants == null || variants.isEmpty()) {
                throw new AppException(
                        "Sản phẩm cần ít nhất 1 biến thể",
                        HttpStatus.BAD_REQUEST,
                        "VARIANT_REQUIRED"
                );
            }

            return variants;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(
                    "Dữ liệu biến thể không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_VARIANTS"
            );
        }
    }

    private void validateVariants(
            List<CreateSellerProductRequest.VariantPayload> variants
    ) {
        for (CreateSellerProductRequest.VariantPayload v : variants) {
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
        }
    }

    private void validateImages(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            throw new AppException(
                    "Vui lòng upload ít nhất 1 ảnh sản phẩm",
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_IMAGE_REQUIRED"
            );
        }

        if (images.size() > MAX_IMAGES) {
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

    private List<ImageStorageService.UploadResult> uploadProductImages(
            Shop shop,
            List<MultipartFile> images
    ) {
        return images.stream()
                .map(file -> imageStorage.uploadWithInfo(
                        file,
                        "products/shop-" + shop.getShopId()
                ))
                .toList();
    }

    private int normalizeThumbnailIndex(Integer index, int size) {
        if (index == null) return 0;

        if (index < 0 || index >= size) return 0;

        return index;
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
        if (value == null) return null;

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private int defaultInt(Integer value) {
        return value == null ? 0 : value;
    }
}
