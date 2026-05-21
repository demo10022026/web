package com.ecommerce.repository;

import com.ecommerce.entity.ShippingProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShippingProviderRepository extends JpaRepository<ShippingProvider, Integer> {

    List<ShippingProvider> findByIsActiveTrueOrderByProviderNameAsc();
}
