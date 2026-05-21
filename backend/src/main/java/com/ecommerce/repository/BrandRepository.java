package com.ecommerce.repository;

import com.ecommerce.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Integer> {

    List<Brand> findByBrandStatus(Brand.Status status);

    Optional<Brand> findByBrandNameIgnoreCase(String brandName);
}
