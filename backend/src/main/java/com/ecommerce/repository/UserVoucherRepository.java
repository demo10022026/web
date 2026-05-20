package com.ecommerce.repository;

import com.ecommerce.entity.User;
import com.ecommerce.entity.UserVoucher;
import com.ecommerce.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserVoucherRepository extends JpaRepository<UserVoucher, Integer> {

    List<UserVoucher> findByUserOrderBySavedAtDesc(User user);

    Optional<UserVoucher> findByUserAndVoucher(User user, Voucher voucher);

    boolean existsByUserAndVoucher(User user, Voucher voucher);
}
