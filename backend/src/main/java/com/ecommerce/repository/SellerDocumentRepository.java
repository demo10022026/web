package com.ecommerce.repository;

import com.ecommerce.entity.SellerDocument;
import com.ecommerce.entity.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SellerDocumentRepository extends JpaRepository<SellerDocument, Integer> {

    List<SellerDocument> findBySeller(SellerProfile seller);

    List<SellerDocument> findBySellerIn(Collection<SellerProfile> sellers);

    Optional<SellerDocument> findFirstBySellerAndDocumentTypeOrderByUploadedAtDesc(
            SellerProfile seller,
            SellerDocument.DocType documentType
    );

    @Modifying
    void deleteBySellerAndDocumentType(
            SellerProfile seller,
            SellerDocument.DocType documentType
    );
}
