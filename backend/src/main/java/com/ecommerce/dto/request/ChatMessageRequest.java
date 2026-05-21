package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Size(max = 2000, message = "Tin nhắn không được vượt quá 2000 ký tự")
    private String content;
}
