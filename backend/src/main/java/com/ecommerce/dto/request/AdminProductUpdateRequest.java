package com.ecommerce.dto.request;

import com.ecommerce.entity.Product;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminProductUpdateRequest {

    @Size(max = 150, message = "Tên sản phẩm tối đa 150 ký tự")
    private String productName;

    private String description;

    private String thumbnailUrl;

    @Size(max = 100, message = "Danh mục tổng tối đa 100 ký tự")
    private String parentCategoryName;

    @Size(max = 100, message = "Danh mục sản phẩm tối đa 100 ký tự")
    private String categoryName;

    @Size(max = 100, message = "Thương hiệu tối đa 100 ký tự")
    private String brandName;

    private Product.Status productStatus;
}