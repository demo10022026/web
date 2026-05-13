package com.ecommerce.service.impl;

import com.ecommerce.dto.response.ProductDtos;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl {

    private final ProductRepository productRepository;
    private final FlashSaleRepository flashSaleRepository;
    private final CategoryRepository categoryRepository;

    // ---- Trang chủ ----

    public List<ProductDtos.ProductSummary> getNewProducts(int limit) {
        Pageable p = PageRequest.of(0, limit);
        return productRepository
            .findByProductStatusOrderByCreatedAtDesc(Product.Status.active, p)
            .stream().map(this::toSummary).collect(Collectors.toList());
    }

    public List<ProductDtos.ProductSummary> getBestSellers(int limit) {
        Pageable p = PageRequest.of(0, limit);
        return productRepository
            .findByProductStatusOrderBySoldCountDesc(Product.Status.active, p)
            .stream().map(this::toSummary).collect(Collectors.toList());
    }

    public List<ProductDtos.FlashSaleProduct> getFlashSaleProducts(int limit) {
        Pageable p = PageRequest.of(0, limit);
        return flashSaleRepository
            .findActiveFlashSales(LocalDateTime.now(), p)
            .stream().map(this::toFlashSale).collect(Collectors.toList());
    }

    // ---- Tìm kiếm / lọc ----

    public Page<ProductDtos.ProductSummary> searchProducts(
            String keyword, Integer categoryId, Integer brandId,
            Long minPrice, Long maxPrice, String sort, int page, int size) {

        Sort sortObj = switch (sort == null ? "newest" : sort) {
            case "price_asc"   -> Sort.by("id").ascending();  // proxy sort
            case "price_desc"  -> Sort.by("id").descending();
            case "bestseller"  -> Sort.by("soldCount").descending();
            default            -> Sort.by("createdAt").descending();
        };
        Pageable pageable = PageRequest.of(page, size, sortObj);

        return productRepository
            .filterProducts(keyword, categoryId, brandId, minPrice, maxPrice, pageable)
            .map(this::toSummary);
    }

    // ---- Chi tiết sản phẩm ----

    public ProductDtos.ProductDetail getProductDetail(Integer productId) {
        Product p = productRepository.findActiveWithDetails(productId)
            .orElseThrow(() -> AppException.notFound("Sản phẩm"));
        return toDetail(p);
    }

    // ---- Categories ----

    public List<ProductDtos.CategoryDto> getCategoryTree() {
        return categoryRepository.findRootCategories().stream()
            .map(this::toCategoryDto).collect(Collectors.toList());
    }

    // =========================================================
    // Mappers
    // =========================================================

    private ProductDtos.ProductSummary toSummary(Product p) {
        var minVariant = p.getVariants().stream()
            .filter(v -> v.getStockQuantity() > 0)
            .min((a, b) -> a.getPrice().compareTo(b.getPrice()))
            .orElse(p.getVariants().isEmpty() ? null : p.getVariants().get(0));

        return ProductDtos.ProductSummary.builder()
            .productId(p.getProductId())
            .productName(p.getProductName())
            .thumbnailUrl(p.getThumbnailUrl())
            .price(minVariant != null ? minVariant.getPrice() : null)
            .originalPrice(minVariant != null ? minVariant.getOriginalPrice() : null)
            .discountPercent(p.getMaxDiscountPercent())
            .soldCount(p.getSoldCount())
            .averageRating(p.getAverageRating())
            .shopName(p.getShop() != null ? p.getShop().getShopName() : null)
            .shopId(p.getShop() != null ? p.getShop().getShopId() : null)
            .categoryName(p.getCategory() != null ? p.getCategory().getCategoryName() : null)
            .build();
    }

    private ProductDtos.ProductDetail toDetail(Product p) {
        List<String> imageUrls = p.getImages().stream()
            .map(ProductImage::getImageUrl).collect(Collectors.toList());

        List<ProductDtos.VariantDto> variants = p.getVariants().stream()
            .map(v -> ProductDtos.VariantDto.builder()
                .variantId(v.getVariantId())
                .variantName(v.getVariantName())
                .sku(v.getSku())
                .price(v.getPrice())
                .originalPrice(v.getOriginalPrice())
                .discountPercent(v.getDiscountPercent())
                .stockQuantity(v.getStockQuantity())
                .imageUrl(v.getImageUrl())
                .build())
            .collect(Collectors.toList());

        ProductDtos.ShopInfo shopInfo = null;
        if (p.getShop() != null) {
            Shop s = p.getShop();
            shopInfo = ProductDtos.ShopInfo.builder()
                .shopId(s.getShopId()).shopName(s.getShopName())
                .shopSlug(s.getShopSlug()).avatarUrl(s.getAvatarUrl())
                .rating(s.getRating()).followerCount(s.getFollowerCount())
                .build();
        }

        return ProductDtos.ProductDetail.builder()
            .productId(p.getProductId())
            .productName(p.getProductName())
            .description(p.getDescription())
            .thumbnailUrl(p.getThumbnailUrl())
            .images(imageUrls)
            .variants(variants)
            .soldCount(p.getSoldCount())
            .averageRating(p.getAverageRating())
            .shop(shopInfo)
            .categoryName(p.getCategory() != null ? p.getCategory().getCategoryName() : null)
            .brandName(p.getBrand() != null ? p.getBrand().getBrandName() : null)
            .createdAt(p.getCreatedAt())
            .build();
    }

    private ProductDtos.FlashSaleProduct toFlashSale(FlashSaleItem f) {
        Product p = f.getProduct();
        var firstVariant = p.getVariants().isEmpty() ? null : p.getVariants().get(0);
        return ProductDtos.FlashSaleProduct.builder()
            .productId(p.getProductId())
            .productName(p.getProductName())
            .thumbnailUrl(p.getThumbnailUrl())
            .salePrice(f.getSalePrice())
            .originalPrice(firstVariant != null ? firstVariant.getOriginalPrice() : null)
            .discountPercent(f.getDiscountPercent().intValue())
            .quantityLimit(f.getQuantityLimit())
            .quantitySold(f.getQuantitySold())
            .remainingPercent(f.getRemainingPercent())
            .endTime(f.getEndTime())
            .build();
    }

    private ProductDtos.CategoryDto toCategoryDto(Category c) {
        List<ProductDtos.CategoryDto> children = c.getChildren() == null ? List.of() :
            c.getChildren().stream().map(this::toCategoryDto).collect(Collectors.toList());
        return ProductDtos.CategoryDto.builder()
            .categoryId(c.getCategoryId())
            .categoryName(c.getCategoryName())
            .children(children)
            .build();
    }
}
