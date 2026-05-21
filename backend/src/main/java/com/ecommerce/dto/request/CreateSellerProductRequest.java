package com.ecommerce.dto.request;

import com.ecommerce.entity.Product;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateSellerProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 150, message = "Tên sản phẩm tối đa 150 ký tự")
    private String productName;

    private String description;

    @NotBlank(message = "Danh mục tổng không được để trống")
    @Size(max = 100, message = "Danh mục tổng tối đa 100 ký tự")
    private String parentCategoryName;

    @NotBlank(message = "Danh mục sản phẩm không được để trống")
    @Size(max = 100, message = "Danh mục sản phẩm tối đa 100 ký tự")
    private String categoryName;

    @Size(max = 100, message = "Thương hiệu tối đa 100 ký tự")
    private String brandName;

    private Product.Status productStatus = Product.Status.active;

    @NotBlank(message = "Biến thể sản phẩm không được để trống")
    private String variantsJson;

    private Integer thumbnailIndex = 0;

    @Getter
    @Setter
    public static class VariantPayload {
        private String variantName;
        private String sku;

        private BigDecimal price;
        private BigDecimal originalPrice;

        private Integer stockQuantity;

        private Integer weight;
        private Integer length;
        private Integer width;
        private Integer height;
    }
}