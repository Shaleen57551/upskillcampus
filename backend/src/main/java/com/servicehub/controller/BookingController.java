package com.servicehub.controller;

import com.servicehub.dto.request.BookingRequest;
import com.servicehub.dto.response.MessageResponse;
import com.servicehub.entity.Booking;
import com.servicehub.entity.ServiceListing;
import com.servicehub.entity.User;
import com.servicehub.repository.BookingRepository;
import com.servicehub.repository.ServiceListingRepository;
import com.servicehub.repository.UserRepository;
import com.servicehub.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    BookingRepository bookingRepository;
    @Autowired
    ServiceListingRepository serviceRepository;
    @Autowired
    UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User customer = userRepository.findById(userDetails.getId()).orElseThrow();
        
        Optional<ServiceListing> serviceOpt = serviceRepository.findById(request.getServiceId());
        if (serviceOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Service not found!"));
        }
        
        ServiceListing service = serviceOpt.get();
        Booking booking = new Booking(service, customer, service.getMerchant(), "PENDING", request.getScheduledDate());
        bookingRepository.save(booking);
        
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<Booking> getCustomerBookings(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return bookingRepository.findByCustomerId(userDetails.getId());
    }

    @GetMapping("/merchant")
    @PreAuthorize("hasRole('MERCHANT')")
    public List<Booking> getMerchantBookings(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return bookingRepository.findByMerchantId(userDetails.getId());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        
        if (bookingOpt.isEmpty()) return ResponseEntity.notFound().build();
        Booking booking = bookingOpt.get();
        
        if (!booking.getMerchant().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Unauthorized"));
        }
        
        booking.setStatus(status.toUpperCase());
        bookingRepository.save(booking);
        return ResponseEntity.ok(new MessageResponse("Status updated to " + status));
    }
}
