package com.ecommerce.repository;

import com.ecommerce.entity.SellerDocument;
import com.ecommerce.entity.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface SellerDocumentRepository
        extends JpaRepository<SellerDocument, Integer> {

    List<SellerDocument> findBySeller(SellerProfile seller);

    Optional<SellerDocument> findFirstBySellerAndDocumentTypeOrderByUploadedAtDesc(
            SellerProfile seller,
            SellerDocument.DocType documentType
    );

    @Modifying
    @Query("""
        DELETE FROM SellerDocument d
        WHERE d.seller = :seller
        AND d.documentType = :type
    """)
    void deleteBySellerAndDocumentType(
            @Param("seller") SellerProfile seller,
            @Param("type") SellerDocument.DocType type
    );
}