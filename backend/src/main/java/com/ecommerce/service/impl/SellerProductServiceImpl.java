package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CreateSellerProductRequest;
import com.ecommerce.dto.request.UpdateSellerProductRequest;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
    @Transactional(readOnly = true)
    public Page<SellerProductResponse> getMyProducts(
            String email,
            String keyword,
            Product.Status status,
            int page,
            int size
    ) {
        Shop shop = findActiveShop(email);

        String cleanKeyword = normalizeText(keyword);
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 100));

        List<SellerProductResponse> filtered = productRepo.findAll()
                .stream()
                .filter(product -> isOwnedByShop(product, shop))
                .filter(product -> status == null || product.getProductStatus() == status)
                .filter(product -> matchesKeyword(product, cleanKeyword))
                .sorted(Comparator.comparing(
                        Product::getProductId,
                        Comparator.nullsLast(Integer::compareTo)
                ).reversed())
                .map(this::toResponse)
                .toList();

        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());

        return new PageImpl<>(
                filtered.subList(fromIndex, toIndex),
                PageRequest.of(safePage, safeSize),
                filtered.size()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SellerProductResponse getMyProductDetail(
            String email,
            Integer productId
    ) {
        Shop shop = findActiveShop(email);
        Product product = findOwnedProduct(productId, shop);

        return toResponse(product);
    }

    @Override
    @Transactional
    public SellerProductResponse createProduct(
            String email,
            CreateSellerProductRequest request,
            List<MultipartFile> images
    ) {
        Shop shop = findActiveShop(email);

        Category category = resolveOrCreateCategory(
                request.getParentCategoryName(),
                request.getCategoryName()
        );

        Brand brand = resolveBrandByName(request.getBrandName());

        List<CreateSellerProductRequest.VariantPayload> variantPayloads =
                parseVariants(request.getVariantsJson());

        validateCreateVariants(variantPayloads);
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

    @Override
    @Transactional
    public SellerProductResponse updateProduct(
            String email,
            Integer productId,
            UpdateSellerProductRequest request
    ) {
        Shop shop = findActiveShop(email);
        Product product = findOwnedProduct(productId, shop);

        if (product.getProductStatus() == Product.Status.banned) {
            throw new AppException(
                    "Sản phẩm đang bị khóa, không thể chỉnh sửa",
                    HttpStatus.FORBIDDEN,
                    "PRODUCT_BANNED"
            );
        }

        Category category = resolveOrCreateCategory(
                request.getParentCategoryName(),
                request.getCategoryName()
        );

        Brand brand = resolveBrandByName(request.getBrandName());

        validateUpdateVariants(request.getVariants());

        product.setCategory(category);
        product.setBrand(brand);
        product.setProductName(request.getProductName().trim());
        product.setDescription(normalizeText(request.getDescription()));
        product.setProductStatus(
                request.getProductStatus() == null
                        ? Product.Status.active
                        : request.getProductStatus()
        );
        product.setUpdatedAt(LocalDateTime.now());

        syncVariants(product, request.getVariants());

        Product saved = productRepo.save(product);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public SellerProductResponse updateProductStatus(
            String email,
            Integer productId,
            Product.Status productStatus
    ) {
        Shop shop = findActiveShop(email);
        Product product = findOwnedProduct(productId, shop);

        if (product.getProductStatus() == Product.Status.banned) {
            throw new AppException(
                    "Sản phẩm đang bị khóa, không thể đổi trạng thái",
                    HttpStatus.FORBIDDEN,
                    "PRODUCT_BANNED"
            );
        }

        if (productStatus == null || productStatus == Product.Status.banned) {
            throw new AppException(
                    "Trạng thái sản phẩm không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PRODUCT_STATUS"
            );
        }

        product.setProductStatus(productStatus);
        product.setUpdatedAt(LocalDateTime.now());

        return toResponse(productRepo.save(product));
    }

    @Override
    @Transactional
    public SellerProductResponse updateVariantStock(
            String email,
            Integer productId,
            Integer variantId,
            Integer stockQuantity
    ) {
        Shop shop = findActiveShop(email);
        Product product = findOwnedProduct(productId, shop);

        if (stockQuantity == null || stockQuantity < 0) {
            throw new AppException(
                    "Tồn kho phải là số nguyên không âm",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_STOCK"
            );
        }

        ProductVariant variant = product.getVariants()
                .stream()
                .filter(v -> variantId != null && variantId.equals(v.getVariantId()))
                .findFirst()
                .orElseThrow(() -> AppException.notFound("Biến thể sản phẩm"));

        variant.setStockQuantity(stockQuantity);
        product.setUpdatedAt(LocalDateTime.now());

        return toResponse(productRepo.save(product));
    }

    @Override
    @Transactional
    public SellerProductResponse addProductImages(
            String email,
            Integer productId,
            List<MultipartFile> images
    ) {
        Shop shop = findActiveShop(email);
        Product product = findOwnedProduct(productId, shop);

        if (product.getProductStatus() == Product.Status.banned) {
            throw new AppException(
                    "Sản phẩm đang bị khóa, không thể thêm ảnh",
                    HttpStatus.FORBIDDEN,
                    "PRODUCT_BANNED"
            );
        }

        validateImages(images);

        int currentImageCount = product.getImages() == null
                ? 0
                : product.getImages().size();

        if (currentImageCount + images.size() > MAX_IMAGES) {
            throw new AppException(
                    "Tối đa 8 ảnh sản phẩm",
                    HttpStatus.BAD_REQUEST,
                    "TOO_MANY_PRODUCT_IMAGES"
            );
        }

        List<ImageStorageService.UploadResult> uploadedImages =
                uploadProductImages(shop, images);

        boolean shouldSetFirstAsThumbnail = currentImageCount == 0;

        for (int i = 0; i < uploadedImages.size(); i++) {
            ImageStorageService.UploadResult uploaded = uploadedImages.get(i);

            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(uploaded.getUrl());
            image.setPublicId(uploaded.getPublicId());
            image.setIsThumbnail(shouldSetFirstAsThumbnail && i == 0);
            image.setCreatedAt(LocalDateTime.now());

            product.getImages().add(image);

            if (shouldSetFirstAsThumbnail && i == 0) {
                product.setThumbnailUrl(uploaded.getUrl());
            }
        }

        product.setUpdatedAt(LocalDateTime.now());

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
        Product product = findOwnedProduct(productId, shop);

        if (product.getProductStatus() == Product.Status.banned) {
            throw new AppException(
                    "Sản phẩm đang bị khóa, không thể xóa ảnh",
                    HttpStatus.FORBIDDEN,
                    "PRODUCT_BANNED"
            );
        }

        if (product.getImages() == null || product.getImages().size() <= 1) {
            throw new AppException(
                    "Sản phẩm cần ít nhất 1 ảnh",
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_IMAGE_REQUIRED"
            );
        }

        ProductImage target = product.getImages()
                .stream()
                .filter(image -> imageId != null && imageId.equals(image.getImageId()))
                .findFirst()
                .orElseThrow(() -> AppException.notFound("Ảnh sản phẩm"));

        boolean wasThumbnail = Boolean.TRUE.equals(target.getIsThumbnail());

        product.getImages().remove(target);

        if (wasThumbnail) {
            ProductImage nextThumbnail = product.getImages().get(0);

            product.getImages().forEach(image -> image.setIsThumbnail(false));
            nextThumbnail.setIsThumbnail(true);
            product.setThumbnailUrl(nextThumbnail.getImageUrl());
        }

        product.setUpdatedAt(LocalDateTime.now());

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
        Product product = findOwnedProduct(productId, shop);

        if (product.getProductStatus() == Product.Status.banned) {
            throw new AppException(
                    "Sản phẩm đang bị khóa, không thể đổi ảnh đại diện",
                    HttpStatus.FORBIDDEN,
                    "PRODUCT_BANNED"
            );
        }

        ProductImage target = product.getImages()
                .stream()
                .filter(image -> imageId != null && imageId.equals(image.getImageId()))
                .findFirst()
                .orElseThrow(() -> AppException.notFound("Ảnh sản phẩm"));

        product.getImages().forEach(image -> image.setIsThumbnail(false));
        target.setIsThumbnail(true);
        product.setThumbnailUrl(target.getImageUrl());
        product.setUpdatedAt(LocalDateTime.now());

        return toResponse(productRepo.save(product));
    }

    private boolean isOwnedByShop(Product product, Shop shop) {
        return product.getShop() != null
                && shop.getShopId() != null
                && shop.getShopId().equals(product.getShop().getShopId());
    }

    private boolean matchesKeyword(Product product, String keyword) {
        if (keyword == null) {
            return true;
        }

        String productName = normalizeText(product.getProductName());
        String categoryName = product.getCategory() == null
                ? null
                : normalizeText(product.getCategory().getCategoryName());
        String brandName = product.getBrand() == null
                ? null
                : normalizeText(product.getBrand().getBrandName());

        return containsText(productName, keyword)
                || containsText(categoryName, keyword)
                || containsText(brandName, keyword);
    }

    private boolean containsText(String source, String keyword) {
        return source != null && source.contains(keyword);
    }

    private Product findOwnedProduct(Integer productId, Shop shop) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));

        if (!isOwnedByShop(product, shop)) {
            throw new AppException(
                    "Bạn không có quyền thao tác sản phẩm này",
                    HttpStatus.FORBIDDEN,
                    "PRODUCT_FORBIDDEN"
            );
        }

        return product;
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
        return categoryRepo
                .findByCategoryNameIgnoreCaseAndParentCategoryIsNull(parentCategoryName)
                .orElseGet(() -> {
                    categoryRepo.findByCategoryNameIgnoreCase(parentCategoryName)
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

                    return categoryRepo.save(category);
                });
    }

    private Category resolveOrCreateChildCategory(
            String categoryName,
            Category parentCategory
    ) {
        return categoryRepo
                .findByCategoryNameIgnoreCaseAndParentCategory_CategoryId(
                        categoryName,
                        parentCategory.getCategoryId()
                )
                .orElseGet(() -> {
                    categoryRepo.findByCategoryNameIgnoreCase(categoryName)
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

                    return categoryRepo.save(category);
                });
    }

    private Brand resolveBrandByName(String rawBrandName) {
        String brandName = normalizeText(rawBrandName);

        if (brandName == null) {
            return null;
        }

        if (brandName.length() > 100) {
            throw new AppException(
                    "Tên thương hiệu tối đa 100 ký tự",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_BRAND_NAME"
            );
        }

        return brandRepo.findByBrandNameIgnoreCase(brandName)
                .map(existingBrand -> {
                    if (existingBrand.getBrandStatus() != Brand.Status.active) {
                        existingBrand.setBrandStatus(Brand.Status.active);
                        return brandRepo.save(existingBrand);
                    }

                    return existingBrand;
                })
                .orElseGet(() -> brandRepo.save(
                        Brand.builder()
                                .brandName(brandName)
                                .brandStatus(Brand.Status.active)
                                .build()
                ));
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
                        .orElseThrow(() -> AppException.notFound("Biến thể sản phẩm"));
            }

            variant.setVariantName(normalizeText(payload.getVariantName()));
            variant.setSku(normalizeText(payload.getSku()));
            variant.setPrice(payload.getPrice());
            variant.setOriginalPrice(payload.getOriginalPrice());
            variant.setStockQuantity(defaultInt(payload.getStockQuantity()));
            variant.setWeight(defaultInt(payload.getWeight()));
            variant.setLength(defaultInt(payload.getLength()));
            variant.setWidth(defaultInt(payload.getWidth()));
            variant.setHeight(defaultInt(payload.getHeight()));
        }
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

    private void validateCreateVariants(
            List<CreateSellerProductRequest.VariantPayload> variants
    ) {
        for (CreateSellerProductRequest.VariantPayload v : variants) {
            validateVariantValues(
                    v.getPrice(),
                    v.getOriginalPrice(),
                    v.getStockQuantity(),
                    v.getWeight(),
                    v.getLength(),
                    v.getWidth(),
                    v.getHeight()
            );
        }
    }

    private void validateUpdateVariants(
            List<UpdateSellerProductRequest.VariantPayload> variants
    ) {
        if (variants == null || variants.isEmpty()) {
            throw new AppException(
                    "Sản phẩm cần ít nhất 1 biến thể",
                    HttpStatus.BAD_REQUEST,
                    "VARIANT_REQUIRED"
            );
        }

        for (UpdateSellerProductRequest.VariantPayload v : variants) {
            validateVariantValues(
                    v.getPrice(),
                    v.getOriginalPrice(),
                    v.getStockQuantity(),
                    v.getWeight(),
                    v.getLength(),
                    v.getWidth(),
                    v.getHeight()
            );
        }
    }

    private void validateVariantValues(
            BigDecimal price,
            BigDecimal originalPrice,
            Integer stockQuantity,
            Integer weight,
            Integer length,
            Integer width,
            Integer height
    ) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(
                    "Giá bán phải lớn hơn 0",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PRICE"
            );
        }

        if (originalPrice != null && originalPrice.compareTo(price) < 0) {
            throw new AppException(
                    "Giá gốc không được nhỏ hơn giá bán",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ORIGINAL_PRICE"
            );
        }

        if (defaultInt(stockQuantity) < 0) {
            throw new AppException(
                    "Tồn kho không được âm",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_STOCK"
            );
        }

        if (
                defaultInt(weight) < 0 ||
                        defaultInt(length) < 0 ||
                        defaultInt(width) < 0 ||
                        defaultInt(height) < 0
        ) {
            throw new AppException(
                    "Kích thước/khối lượng không được âm",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_DIMENSION"
            );
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