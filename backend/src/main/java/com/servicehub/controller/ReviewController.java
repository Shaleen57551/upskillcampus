package com.servicehub.controller;

import com.servicehub.entity.Booking;
import com.servicehub.entity.Review;
import com.servicehub.repository.BookingRepository;
import com.servicehub.repository.ReviewRepository;
import com.servicehub.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    
    @Autowired
    ReviewRepository reviewRepository;
    @Autowired
    BookingRepository bookingRepository;
    @Autowired
    com.servicehub.repository.ServiceListingRepository serviceRepository;

    @PostMapping("/{bookingId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createReview(@PathVariable Long bookingId, @RequestParam int rating, @RequestParam String comment, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        
        if (bookingOpt.isEmpty()) return ResponseEntity.notFound().build();
        Booking booking = bookingOpt.get();
        
        if (!booking.getCustomer().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body("Unauthorized to review this booking.");
        }
        
        if (!booking.getStatus().equals("COMPLETED")) {
            return ResponseEntity.badRequest().body("Can only review completed bookings.");
        }
        
        Review review = new Review(booking, rating, comment);
        reviewRepository.save(review);
        
        // Update Average Rating
        ServiceListing service = booking.getService();
        Double currentAvg = service.getAverageRating() == null ? 0.0 : service.getAverageRating();
        Integer currentCount = service.getReviewCount() == null ? 0 : service.getReviewCount();
        
        Integer newCount = currentCount + 1;
        Double newAvg = ((currentAvg * currentCount) + rating) / newCount;
        
        service.setReviewCount(newCount);
        service.setAverageRating(newAvg);
        serviceRepository.save(service);
        
        return ResponseEntity.ok(review);
    }
    
    @GetMapping("/merchant/{merchantId}")
    public List<Review> getMerchantReviews(@PathVariable Long merchantId) {
        return reviewRepository.findByBookingServiceMerchantId(merchantId);
    }
}
