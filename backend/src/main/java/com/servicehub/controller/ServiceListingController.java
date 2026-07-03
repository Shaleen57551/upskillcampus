package com.servicehub.controller;

import com.servicehub.dto.request.ServiceRequest;
import com.servicehub.dto.response.MessageResponse;
import com.servicehub.entity.Category;
import com.servicehub.entity.ServiceListing;
import com.servicehub.entity.User;
import com.servicehub.repository.CategoryRepository;
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
@RequestMapping("/api/services")
public class ServiceListingController {
    @Autowired
    ServiceListingRepository serviceRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    CategoryRepository categoryRepository;

    @GetMapping
    public List<ServiceListing> getAllServices() {
        return serviceRepository.findAll();
    }
    
    @GetMapping("/merchant/{merchantId}")
    public List<ServiceListing> getServicesByMerchant(@PathVariable Long merchantId) {
        return serviceRepository.findByMerchantId(merchantId);
    }
    
    @GetMapping("/search")
    public ResponseEntity<?> searchServices(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
            
        try {
            String[] sortParams = sort.split(",");
            org.springframework.data.domain.Sort.Direction dir = sortParams[1].equalsIgnoreCase("desc") ? 
                    org.springframework.data.domain.Sort.Direction.DESC : org.springframework.data.domain.Sort.Direction.ASC;
            
            org.springframework.data.domain.Pageable pagingSort = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(dir, sortParams[0]));
            
            org.springframework.data.domain.Page<ServiceListing> pageTuts = serviceRepository.searchServices(query, categoryId, minPrice, maxPrice, minRating, pagingSort);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("services", pageTuts.getContent());
            response.put("currentPage", pageTuts.getNumber());
            response.put("totalItems", pageTuts.getTotalElements());
            response.put("totalPages", pageTuts.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    
    @PostMapping
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<?> createService(@Valid @RequestBody ServiceRequest request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User merchant = userRepository.findById(userDetails.getId()).orElse(null);
        
        Optional<Category> category = categoryRepository.findById(request.getCategoryId());
        if (category.isEmpty()) return ResponseEntity.badRequest().body(new MessageResponse("Error: Category not found."));
        
        ServiceListing service = new ServiceListing(request.getTitle(), request.getDescription(), request.getPrice(), merchant, category.get(), request.getDuration(), request.getImageUrl());
        serviceRepository.save(service);
        
        return ResponseEntity.ok(service);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<?> updateService(@PathVariable Long id, @Valid @RequestBody ServiceRequest request, Authentication authentication) {
        Optional<ServiceListing> serviceOpt = serviceRepository.findById(id);
        if (serviceOpt.isEmpty()) return ResponseEntity.notFound().build();
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ServiceListing service = serviceOpt.get();
        
        if (!service.getMerchant().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to edit this service."));
        }
        
        Optional<Category> category = categoryRepository.findById(request.getCategoryId());
        if (category.isEmpty()) return ResponseEntity.badRequest().body(new MessageResponse("Error: Category not found."));
        
        service.setTitle(request.getTitle());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setCategory(category.get());
        service.setDuration(request.getDuration());
        service.setImageUrl(request.getImageUrl());
        
        serviceRepository.save(service);
        return ResponseEntity.ok(service);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MERCHANT') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteService(@PathVariable Long id, Authentication authentication) {
        Optional<ServiceListing> serviceOpt = serviceRepository.findById(id);
        if (serviceOpt.isEmpty()) return ResponseEntity.notFound().build();
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ServiceListing service = serviceOpt.get();
        
        // Ensure merchant owns the service, or user is admin
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !service.getMerchant().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to delete this service."));
        }
        
        serviceRepository.delete(service);
        return ResponseEntity.ok(new MessageResponse("Service deleted successfully!"));
    }
}
