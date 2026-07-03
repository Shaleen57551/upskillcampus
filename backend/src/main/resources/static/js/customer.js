const API_URL = "/api";
let currentUser = JSON.parse(localStorage.getItem("user"));
let token = localStorage.getItem("token");
let bookModal;
let reviewModal;

if (!token || currentUser.role !== "ROLE_CUSTOMER") {
    alert("Unauthorized!");
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("userGreeting").innerHTML = `Hello, <strong>${currentUser.username}</strong>`;
    
    bookModal = new bootstrap.Modal(document.getElementById('bookModal'));
    reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));

    // Tab switching styles
    const tabs = document.querySelectorAll('.dashboard-tabs .nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => { t.classList.remove('bg-white', 'text-primary'); t.classList.add('text-white'); });
            e.target.classList.remove('text-white');
            e.target.classList.add('bg-white', 'text-primary');
        });
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "../login.html";
    });
    
    document.getElementById("bookForm").addEventListener("submit", handleBookingSubmit);
    document.getElementById("profileForm").addEventListener("submit", handleProfileSubmit);
    document.getElementById("logoUpload").addEventListener("change", (e) => handleFileUpload(e, 'profileLogoPreview', 'profileLogoUrl'));
    document.getElementById("reviewForm").addEventListener("submit", submitReview);

    loadCategories();
    fetchServices();
    loadMyBookings();
    loadProfile();
});

async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        if(res.ok) {
            const categories = await res.json();
            const select = document.getElementById("filterCategory");
            categories.forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        }
    } catch(e) { console.error(e); }
}

async function fetchServices() {
    const query = document.getElementById("searchName").value;
    const categoryId = document.getElementById("filterCategory").value;
    const minPrice = document.getElementById("minPrice").value;
    const maxPrice = document.getElementById("maxPrice").value;
    const minRating = document.getElementById("minRating").value;
    const sort = document.getElementById("sortOrder").value;
    
    let url = `${API_URL}/services/search?size=50&sort=${sort}`;
    if(query) url += `&query=${encodeURIComponent(query)}`;
    if(categoryId) url += `&categoryId=${categoryId}`;
    if(minPrice) url += `&minPrice=${minPrice}`;
    if(maxPrice) url += `&maxPrice=${maxPrice}`;
    if(minRating) url += `&minRating=${minRating}`;
    
    try {
        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if(res.ok) {
            const data = await res.json();
            renderServices(data.services);
        }
    } catch (err) { console.error("Error loading services", err); }
}

function renderServices(services) {
    const grid = document.getElementById("servicesGrid");
    grid.innerHTML = "";
    
    if (services.length === 0) {
        grid.innerHTML = `<div class="col-12"><p class="text-muted">No services found matching your criteria.</p></div>`;
        return;
    }
    
    services.forEach(s => {
        const imgUrl = s.imageUrl || 'https://via.placeholder.com/200';
        let stars = s.averageRating > 0 ? `⭐ ${s.averageRating.toFixed(1)} (${s.reviewCount})` : 'New';
        
        grid.innerHTML += `
            <div class="col-md-4 mb-4">
                <div class="service-card p-0 d-flex flex-column h-100">
                    <div class="bg-light text-center border-bottom position-relative" style="height: 150px; overflow: hidden;">
                        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                        <span class="badge bg-dark position-absolute top-0 end-0 m-2">${stars}</span>
                    </div>
                    <div class="p-4 flex-grow-1 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="fw-bold text-dark mb-0">${s.title}</h5>
                            <span class="badge bg-success bg-opacity-10 text-success rounded-pill">$${s.price.toFixed(2)}</span>
                        </div>
                        <p class="text-primary small fw-semibold mb-2"><i class="fa-solid fa-tag me-1"></i>${s.category.name}</p>
                        <p class="text-muted small mb-3 flex-grow-1">${s.description.substring(0, 80)}${s.description.length > 80 ? '...' : ''}</p>
                        <div class="mt-auto">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-secondary rounded-circle text-white d-flex justify-content-center align-items-center" style="width:30px; height:30px; font-size: 12px;"><i class="fa-solid fa-user"></i></div>
                                <span class="ms-2 small fw-medium text-dark">${s.merchant.businessName || s.merchant.username}</span>
                                <span class="ms-auto small text-muted"><i class="fa-regular fa-clock me-1"></i>${s.duration || 'N/A'}</span>
                            </div>
                            <button class="btn btn-primary w-100 rounded-pill fw-bold shadow-sm" onclick='openBookModal(${JSON.stringify(s).replace(/'/g, "&#39;")})'>Book Now</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function openBookModal(service) {
    document.getElementById("bookServiceId").value = service.id;
    document.getElementById("bookServiceTitle").textContent = service.title;
    document.getElementById("bookServicePrice").textContent = "$" + service.price.toFixed(2);
    document.getElementById("bookServiceImage").src = service.imageUrl || 'https://via.placeholder.com/60';
    
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("scheduledDate").min = now.toISOString().slice(0,16);
    
    bookModal.show();
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    const serviceId = document.getElementById("bookServiceId").value;
    const scheduledDate = document.getElementById("scheduledDate").value;
    
    try {
        const res = await fetch(`${API_URL}/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ serviceId: serviceId, scheduledDate: scheduledDate })
        });
        if(res.ok) {
            showToast("Service booked successfully!");
            bookModal.hide();
            loadMyBookings();
            document.getElementById("bookings-tab").click();
        } else {
            alert("Failed to book service.");
        }
    } catch (err) { console.error(err); }
}

async function loadMyBookings() {
    try {
        const res = await fetch(`${API_URL}/bookings/customer`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const bookings = await res.json();
        const list = document.getElementById("bookingsList");
        list.innerHTML = "";
        
        if (bookings.length === 0) {
            list.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">You have no bookings yet.</td></tr>`;
            return;
        }
        
        bookings.forEach(b => {
            let badgeClass = "bg-secondary";
            if(b.status === "PENDING") badgeClass = "badge-pending";
            if(b.status === "COMPLETED") badgeClass = "badge-completed";
            if(b.status === "ACCEPTED") badgeClass = "bg-primary text-white";
            if(b.status === "REJECTED") badgeClass = "bg-danger text-white";
            
            let reviewAction = '';
            if (b.status === "COMPLETED") {
                reviewAction = `<button class="btn btn-sm btn-outline-warning rounded-pill px-3" onclick="openReviewModal(${b.id})"><i class="fa-solid fa-star me-1"></i>Review</button>`;
            }
            
            list.innerHTML += `
                <tr>
                    <td class="fw-bold">${b.service.title}</td>
                    <td>${b.merchant.businessName || b.merchant.username}</td>
                    <td>${new Date(b.scheduledDate).toLocaleString()}</td>
                    <td><span class="badge ${badgeClass} px-3 py-2 rounded-pill">${b.status}</span></td>
                    <td class="text-end">${reviewAction}</td>
                </tr>
            `;
        });
    } catch(err) { console.error("Error loading bookings", err); }
}

function openReviewModal(bookingId) {
    document.getElementById("reviewForm").reset();
    document.getElementById("reviewBookingId").value = bookingId;
    reviewModal.show();
}

async function submitReview(e) {
    e.preventDefault();
    const bookingId = document.getElementById("reviewBookingId").value;
    const rating = document.getElementById("reviewRating").value;
    const comment = document.getElementById("reviewComment").value;
    
    const res = await fetch(`${API_URL}/reviews/${bookingId}?rating=${rating}&comment=${encodeURIComponent(comment)}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });
    
    if(res.ok) {
        showToast("Review submitted successfully!");
        reviewModal.hide();
        fetchServices();
    } else {
        const text = await res.text();
        alert(text || "Failed to submit review");
    }
}

async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/customers/profile`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const profile = await res.json();
            document.getElementById("customerEmail").value = profile.email;
            if(profile.businessName) document.getElementById("fullName").value = profile.businessName;
            if(profile.contactPhone) document.getElementById("contactPhone").value = profile.contactPhone;
            if(profile.logoUrl) {
                document.getElementById("profileLogoUrl").value = profile.logoUrl;
                document.getElementById("profileLogoPreview").src = profile.logoUrl;
            }
        }
    } catch (err) { console.error("Error loading profile", err); }
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    const request = {
        businessName: document.getElementById("fullName").value, 
        contactPhone: document.getElementById("contactPhone").value,
        logoUrl: document.getElementById("profileLogoUrl").value
    };
    
    const res = await fetch(`${API_URL}/customers/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(request)
    });
    
    if (res.ok) {
        showToast("Profile updated successfully!");
        const updatedUser = await res.json();
        document.getElementById("userGreeting").innerHTML = `Hello, <strong>${updatedUser.businessName || updatedUser.username}</strong>`;
    }
}

async function handleFileUpload(e, previewId, hiddenInputId) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    const reader = new FileReader();
    reader.onload = (e) => document.getElementById(previewId).src = e.target.result;
    reader.readAsDataURL(file);
    
    try {
        const res = await fetch(`${API_URL}/upload`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        
        if (res.ok) {
            const data = await res.json();
            document.getElementById(hiddenInputId).value = data.url;
            showToast("Picture uploaded successfully!");
        } else {
            alert("Upload failed");
        }
    } catch(err) { console.error(err); }
}

function showToast(message) {
    document.getElementById("toastMessage").textContent = message;
    const toast = new bootstrap.Toast(document.getElementById('liveToast'));
    toast.show();
}
