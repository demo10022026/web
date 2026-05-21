package com.ecommerce.dto.request;

import com.ecommerce.entity.Product;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "Danh mục cha không được để trống")
    private Integer parentCategoryId;

    @NotNull(message = "Danh mục con không được để trống")
    private Integer categoryId;

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
