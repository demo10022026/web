package com.ecommerce.dto.request;

import com.ecommerce.entity.Product;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class UpdateSellerProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 150, message = "Tên sản phẩm tối đa 150 ký tự")
    private String productName;

    private String description;

    @NotNull(message = "Danh mục tổng không được để trống")
    private Integer parentCategoryId;

    @NotNull(message = "Danh mục sản phẩm không được để trống")
    private Integer categoryId;

    private Integer brandId;

    @NotNull(message = "Trạng thái sản phẩm không được để trống")
    private Product.Status productStatus;

    @NotNull(message = "Biến thể sản phẩm không được để trống")
    private List<VariantPayload> variants;

    @Getter
    @Setter
    public static class VariantPayload {
        private Integer variantId;

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
