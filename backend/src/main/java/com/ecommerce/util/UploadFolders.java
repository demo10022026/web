package com.ecommerce.util;

import com.ecommerce.entity.SellerDocument;

public final class UploadFolders {

    private UploadFolders() {
    }

    public static String sellerDocument(Integer sellerId, SellerDocument.DocType type) {
        return "seller-documents/seller-" + sellerId + "/" + sellerDocFolder(type);
    }

    public static String shopAvatar(Integer shopId) {
        return "shops/shop-" + shopId + "/avatar";
    }

    public static String shopBanner(Integer shopId) {
        return "shops/shop-" + shopId + "/banner";
    }

    public static String productThumbnail(Integer shopId, Integer productId) {
        return "products/shop-" + shopId + "/product-" + productId + "/thumbnail";
    }

    public static String productGallery(Integer shopId, Integer productId) {
        return "products/shop-" + shopId + "/product-" + productId + "/gallery";
    }

    public static String productVariant(Integer shopId, Integer productId) {
        return "products/shop-" + shopId + "/product-" + productId + "/variants";
    }

    public static String userAvatar(Integer userId) {
        return "users/user-" + userId + "/avatar";
    }

    public static String reviewImage(Integer productId, Integer userId) {
        return "reviews/product-" + productId + "/user-" + userId;
    }

    private static String sellerDocFolder(SellerDocument.DocType type) {
        return switch (type) {
            case citizen_id -> "citizen-id-front";
            case citizen_id_back -> "citizen-id-back";
            case business_license -> "business-license";
            case tax_document -> "tax-document";
        };
    }
}