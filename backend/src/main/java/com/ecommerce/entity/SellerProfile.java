package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "seller_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SellerProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seller_id")
    private Integer sellerId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    @Builder.Default
    private Status verificationStatus = Status.pending;

    @Column(name = "identity_number", length = 50)
    private String identityNumber;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum Status { pending, approved, rejected, suspended }
}
