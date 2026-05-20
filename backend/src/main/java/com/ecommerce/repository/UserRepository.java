package com.ecommerce.repository;

import com.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByPhoneNumber(String phoneNumber);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByPhoneNumber(String phoneNumber);

    long countByRole(User.Role role);

    long countByAccountStatus(User.AccountStatus accountStatus);

    @Query("""
        SELECT u
        FROM User u
        WHERE (:role IS NULL OR u.role = :role)
        AND (:accountStatus IS NULL OR u.accountStatus = :accountStatus)
        AND (
            :keyword IS NULL
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
    """)
    Page<User> adminSearchUsers(
            @Param("role") User.Role role,
            @Param("accountStatus") User.AccountStatus accountStatus,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
