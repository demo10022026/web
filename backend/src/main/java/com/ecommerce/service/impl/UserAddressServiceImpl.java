package com.ecommerce.service.impl;

import com.ecommerce.dto.request.UserAddressRequest;
import com.ecommerce.dto.response.UserAddressResponse;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserAddress;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.UserAddressRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.UserAddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAddressServiceImpl implements UserAddressService {

    private final UserRepository userRepo;
    private final UserAddressRepository addressRepo;

    @Override
    @Transactional(readOnly = true)
    public List<UserAddressResponse> getMyAddresses(String email) {
        User user = findUser(email);

        return addressRepo.findByUserOrderByIsDefaultDescCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserAddressResponse createAddress(
            String email,
            UserAddressRequest request
    ) {
        User user = findUser(email);

        boolean firstAddress = addressRepo.countByUser(user) == 0;
        boolean shouldSetDefault = firstAddress || Boolean.TRUE.equals(request.getIsDefault());

        if (shouldSetDefault) {
            addressRepo.clearDefaultByUser(user);
        }

        UserAddress address = UserAddress.builder()
                .user(user)
                .receiverName(normalizeRequired(request.getReceiverName()))
                .receiverPhone(normalizeRequired(request.getReceiverPhone()))
                .provinceCode(normalizeText(request.getProvinceCode()))
                .districtCode(normalizeText(request.getDistrictCode()))
                .wardCode(normalizeText(request.getWardCode()))
                .provinceName(normalizeRequired(request.getProvinceName()))
                .districtName(normalizeRequired(request.getDistrictName()))
                .wardName(normalizeRequired(request.getWardName()))
                .addressLine(normalizeRequired(request.getAddressLine()))
                .addressType(request.getAddressType() == null
                        ? UserAddress.AddressType.home
                        : request.getAddressType())
                .isDefault(shouldSetDefault)
                .build();

        return toResponse(addressRepo.save(address));
    }

    @Override
    @Transactional
    public UserAddressResponse updateAddress(
            String email,
            Integer addressId,
            UserAddressRequest request
    ) {
        User user = findUser(email);

        UserAddress address = addressRepo.findByAddressIdAndUser(addressId, user)
                .orElseThrow(() -> AppException.notFound("Địa chỉ"));

        boolean shouldSetDefault = Boolean.TRUE.equals(request.getIsDefault());

        if (shouldSetDefault) {
            addressRepo.clearDefaultByUser(user);
            address.setIsDefault(true);
        } else {
            address.setIsDefault(Boolean.TRUE.equals(address.getIsDefault()));
        }

        address.setReceiverName(normalizeRequired(request.getReceiverName()));
        address.setReceiverPhone(normalizeRequired(request.getReceiverPhone()));

        address.setProvinceCode(normalizeText(request.getProvinceCode()));
        address.setDistrictCode(normalizeText(request.getDistrictCode()));
        address.setWardCode(normalizeText(request.getWardCode()));

        address.setProvinceName(normalizeRequired(request.getProvinceName()));
        address.setDistrictName(normalizeRequired(request.getDistrictName()));
        address.setWardName(normalizeRequired(request.getWardName()));

        address.setAddressLine(normalizeRequired(request.getAddressLine()));
        address.setAddressType(request.getAddressType() == null
                ? UserAddress.AddressType.home
                : request.getAddressType());

        return toResponse(addressRepo.save(address));
    }

    @Override
    @Transactional
    public void deleteAddress(
            String email,
            Integer addressId
    ) {
        User user = findUser(email);

        UserAddress address = addressRepo.findByAddressIdAndUser(addressId, user)
                .orElseThrow(() -> AppException.notFound("Địa chỉ"));

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());

        addressRepo.delete(address);

        if (wasDefault) {
            List<UserAddress> remain = addressRepo
                    .findByUserOrderByIsDefaultDescCreatedAtDesc(user);

            if (!remain.isEmpty()) {
                UserAddress nextDefault = remain.get(0);
                nextDefault.setIsDefault(true);
                addressRepo.save(nextDefault);
            }
        }
    }

    @Override
    @Transactional
    public UserAddressResponse setDefaultAddress(
            String email,
            Integer addressId
    ) {
        User user = findUser(email);

        UserAddress address = addressRepo.findByAddressIdAndUser(addressId, user)
                .orElseThrow(() -> AppException.notFound("Địa chỉ"));

        addressRepo.clearDefaultByUser(user);

        address.setIsDefault(true);

        return toResponse(addressRepo.save(address));
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private UserAddressResponse toResponse(UserAddress address) {
        return UserAddressResponse.builder()
                .addressId(address.getAddressId())
                .receiverName(address.getReceiverName())
                .receiverPhone(address.getReceiverPhone())

                .provinceCode(address.getProvinceCode())
                .districtCode(address.getDistrictCode())
                .wardCode(address.getWardCode())

                .provinceName(address.getProvinceName())
                .districtName(address.getDistrictName())
                .wardName(address.getWardName())

                .addressLine(address.getAddressLine())
                .fullAddress(buildFullAddress(address))

                .addressType(address.getAddressType() == null
                        ? null
                        : address.getAddressType().name())
                .isDefault(Boolean.TRUE.equals(address.getIsDefault()))

                .createdAt(address.getCreatedAt())
                .build();
    }

    private String buildFullAddress(UserAddress address) {
        return String.join(
                ", ",
                address.getAddressLine(),
                address.getWardName(),
                address.getDistrictName(),
                address.getProvinceName()
        );
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeText(value);

        return normalized == null ? "" : normalized;
    }
}