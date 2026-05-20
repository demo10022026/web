package com.ecommerce.service;

import com.ecommerce.dto.request.UserAddressRequest;
import com.ecommerce.dto.response.UserAddressResponse;

import java.util.List;

public interface UserAddressService {

    List<UserAddressResponse> getMyAddresses(String email);

    UserAddressResponse createAddress(
            String email,
            UserAddressRequest request
    );

    UserAddressResponse updateAddress(
            String email,
            Integer addressId,
            UserAddressRequest request
    );

    void deleteAddress(
            String email,
            Integer addressId
    );

    UserAddressResponse setDefaultAddress(
            String email,
            Integer addressId
    );
}