package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SellerDocument {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Integer documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type",
            columnDefinition = "ENUM('citizen_id','business_license','tax_document')")
    private DocType documentType;

    @Column(name = "document_url", columnDefinition = "TEXT", nullable = false)
    private String documentUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status",
            columnDefinition = "ENUM('pending','approved','rejected') DEFAULT 'pending'")
    @Builder.Default
    private VerifyStatus verificationStatus = VerifyStatus.pending;

    @Column(name = "uploaded_at")
    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();

    public enum DocType      { citizen_id, business_license, tax_document }
    public enum VerifyStatus { pending, approved, rejected }
}
