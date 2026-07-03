package com.servicehub.controller;

import com.servicehub.dto.request.UserProfileRequest;
import com.servicehub.dto.response.MerchantStatsResponse;
import com.servicehub.entity.Booking;
import com.servicehub.entity.User;
import com.servicehub.repository.BookingRepository;
import com.servicehub.repository.ServiceListingRepository;
import com.servicehub.repository.UserRepository;
import com.servicehub.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/merchants")
public class MerchantController {

    @Autowired
    UserRepository userRepository;
    
    @Autowired
    ServiceListingRepository serviceRepository;
    
    @Autowired
    BookingRepository bookingRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<?> getStats(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long merchantId = userDetails.getId();
        
        long totalServices = serviceRepository.findByMerchantId(merchantId).size();
        List<Booking> bookings = bookingRepository.findByMerchantId(merchantId);
        
        long activeBookings = bookings.stream()
                .filter(b -> b.getStatus().equals("PENDING") || b.getStatus().equals("ACCEPTED"))
                .count();
                
        long completedBookings = bookings.stream()
                .filter(b -> b.getStatus().equals("COMPLETED"))
                .count();
                
        BigDecimal totalEarnings = bookings.stream()
                .filter(b -> b.getStatus().equals("COMPLETED"))
                .map(b -> b.getService().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        return ResponseEntity.ok(new MerchantStatsResponse(totalServices, activeBookings, completedBookings, totalEarnings));
    }
    
    @PutMapping("/profile")
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<?> updateProfile(@RequestBody UserProfileRequest request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        User user = userOpt.get();
        
        user.setBusinessName(request.getBusinessName());
        user.setContactPhone(request.getContactPhone());
        user.setLogoUrl(request.getLogoUrl());
        
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
    
    @GetMapping("/profile")
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(userOpt.get());
    }
}
