package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_vouchers",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_voucher",
                        columnNames = {"user_id", "voucher_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @Column(name = "saved_at", insertable = false, updatable = false)
    private LocalDateTime savedAt;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;
}
