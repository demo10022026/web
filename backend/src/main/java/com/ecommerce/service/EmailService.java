package com.ecommerce.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String toEmail, String otp, String purpose) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(getSubject(purpose));
            helper.setText(buildHtml(otp, purpose), true);

            mailSender.send(message);
            log.info("Đã gửi OTP email đến: {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi gửi email đến {}: {}", toEmail, e.getMessage());
        }
    }

    private String getSubject(String purpose) {
        return switch (purpose) {
            case "FORGOT_PASSWORD" -> "[ShopVN] Mã đặt lại mật khẩu";
            case "EMAIL_VERIFY"    -> "[ShopVN] Xác nhận email của bạn";
            case "PHONE_VERIFY"    -> "[ShopVN] Xác nhận số điện thoại";
            default                -> "[ShopVN] Mã xác thực OTP";
        };
    }

    private String buildHtml(String otp, String purpose) {
        String action = switch (purpose) {
            case "FORGOT_PASSWORD" -> "đặt lại mật khẩu";
            case "EMAIL_VERIFY"    -> "xác nhận email";
            default                -> "xác thực tài khoản";
        };
        return """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;
                        border:1px solid #eee;border-radius:12px;">
              <h2 style="color:#f97316;margin-bottom:8px;">ShopVN</h2>
              <p style="color:#555;">Mã OTP để <strong>%s</strong> của bạn là:</p>
              <div style="font-size:40px;font-weight:bold;letter-spacing:12px;
                          color:#111;text-align:center;padding:20px 0;">%s</div>
              <p style="color:#999;font-size:13px;">Mã có hiệu lực trong <strong>5 phút</strong>.
                 Không chia sẻ mã này với bất kỳ ai.</p>
            </div>
            """.formatted(action, otp);
    }
}
