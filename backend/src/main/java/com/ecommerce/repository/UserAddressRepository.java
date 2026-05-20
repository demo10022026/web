package com.ecommerce.repository;

import com.ecommerce.entity.User;
import com.ecommerce.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Integer> {

    List<UserAddress> findByUserOrderByIsDefaultDescCreatedAtDesc(User user);

    Optional<UserAddress> findByAddressIdAndUser(Integer addressId, User user);

    long countByUser(User user);

    @Modifying
    @Query("""
        UPDATE UserAddress a
        SET a.isDefault = false
        WHERE a.user = :user
    """)
    void clearDefaultByUser(User user);
}