package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SellerProductOptionsResponse {

    private List<CategoryOption> categories;
    private List<BrandOption> brands;

    @Getter
    @Builder
    public static class CategoryOption {
        private Integer categoryId;
        private String categoryName;
        private Integer parentCategoryId;
    }

    @Getter
    @Builder
    public static class BrandOption {
        private Integer brandId;
        private String brandName;
    }
}