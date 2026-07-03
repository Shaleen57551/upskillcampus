package com.servicehub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ServiceRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private BigDecimal price;
    @NotNull
    private Long categoryId;
    
    private String duration;
    private String imageUrl;
}
