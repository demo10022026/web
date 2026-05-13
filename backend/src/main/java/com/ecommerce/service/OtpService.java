package com.ecommerce.service;

import com.ecommerce.entity.OtpCode;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;
    private static final int OTP_EXPIRE_MINUTES = 5;

    @Transactional
    public void sendOtp(String email, OtpCode.Purpose purpose) {
        // Hủy OTP cũ
        otpRepository.invalidateAllByEmailAndPurpose(email, purpose);

        String code = generateCode();

        OtpCode otp = OtpCode.builder()
                .email(email)
                .code(code)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES))
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(email, code, purpose.name());
    }

    @Transactional
    public void verifyOtp(String email, String code, OtpCode.Purpose purpose) {
        OtpCode otp = otpRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new AppException("Mã OTP không tồn tại hoặc đã được sử dụng",
                        org.springframework.http.HttpStatus.BAD_REQUEST, "OTP_INVALID"));

        if (otp.isExpired()) {
            throw new AppException("Mã OTP đã hết hạn",
                    org.springframework.http.HttpStatus.BAD_REQUEST, "OTP_EXPIRED");
        }

        if (!otp.getCode().equals(code)) {
            throw new AppException("Mã OTP không đúng",
                    org.springframework.http.HttpStatus.BAD_REQUEST, "OTP_WRONG");
        }

        otp.setUsed(true);
        otpRepository.save(otp);
    }

    // Dọn OTP hết hạn mỗi giờ
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanExpiredOtps() {
        otpRepository.deleteExpired(LocalDateTime.now());
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(1_000_000));
    }
}
