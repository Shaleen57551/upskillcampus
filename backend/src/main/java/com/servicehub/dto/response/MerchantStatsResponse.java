package com.servicehub.dto.response;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;
@Data
@AllArgsConstructor
public class MerchantStatsResponse {
    private long totalServices;
    private long activeBookings;
    private long completedBookings;
    private BigDecimal totalEarnings;
}
