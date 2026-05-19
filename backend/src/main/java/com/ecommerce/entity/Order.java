package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    // ───────────────── USER ─────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ───────────────── SHIPPING PROVIDER ─────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_provider_id")
    private ShippingProvider shippingProvider;

    // ───────────────── STATUS ─────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status")
    private OrderStatus orderStatus = OrderStatus.pending;

    // ───────────────── MONEY ─────────────────
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "shipping_fee", precision = 12, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    // ───────────────── RECEIVER ─────────────────
    @Column(name = "receiver_name", nullable = false, length = 100)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false, length = 15)
    private String receiverPhone;

    @Column(name = "province_name", nullable = false, length = 100)
    private String provinceName;

    @Column(name = "district_name", nullable = false, length = 100)
    private String districtName;

    @Column(name = "ward_name", nullable = false, length = 100)
    private String wardName;

    @Column(name = "shipping_address", nullable = false, columnDefinition = "TEXT")
    private String shippingAddress;

    // ───────────────── SHIPPING CODE ─────────────────
    @Column(name = "ghn_order_code", length = 100)
    private String ghnOrderCode;

    @Column(name = "tracking_code", length = 100)
    private String trackingCode;

    // ───────────────── TIME ─────────────────
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // ───────────────── ENUM ─────────────────
    public enum OrderStatus {
        pending,
        processing,
        shipping,
        delivered,
        cancelled,
        returned
    }
}