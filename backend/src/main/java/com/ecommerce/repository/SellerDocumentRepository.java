package com.ecommerce.repository;

import com.ecommerce.entity.SellerDocument;
import com.ecommerce.entity.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SellerDocumentRepository extends JpaRepository<SellerDocument, Integer> {

    List<SellerDocument> findBySeller(SellerProfile seller);

    @Modifying
    @Query("DELETE FROM SellerDocument d WHERE d.seller = :seller AND d.documentType = :type")
    void deleteBySellerAndDocumentType(SellerProfile seller, SellerDocument.DocType type);
}
