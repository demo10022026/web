package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "brands")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Brand {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brand_id")
    private Integer brandId;

    @Column(name = "brand_name", unique = true, nullable = false, length = 100)
    private String brandName;

    @Enumerated(EnumType.STRING)
    @Column(name = "brand_status")
    @Builder.Default
    private Status brandStatus = Status.active;

    public enum Status { active, inactive }
}
