const API_URL = "/api";
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
let serviceModal;

if (!token || user.role !== "ROLE_MERCHANT") {
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("userGreeting").innerHTML = `Hello, <strong>${user.username}</strong>`;
    
    serviceModal = new bootstrap.Modal(document.getElementById('addServiceModal'));
    
    // Tab switching styles
    const tabs = document.querySelectorAll('.dashboard-tabs .nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => { t.classList.remove('bg-white', 'text-dark'); t.classList.add('text-white'); });
            e.target.classList.remove('text-white');
            e.target.classList.add('bg-white', 'text-dark');
        });
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../login.html";
    });

    document.getElementById("addServiceForm").addEventListener("submit", handleServiceSubmit);
    document.getElementById("profileForm").addEventListener("submit", handleProfileSubmit);

    // File Upload listeners
    document.getElementById("logoUpload").addEventListener("change", (e) => handleFileUpload(e, 'profileLogoPreview', 'profileLogoUrl'));
    document.getElementById("serviceImageUpload").addEventListener("change", (e) => handleFileUpload(e, 'serviceImagePreview', 'serviceImageUrl'));

    loadCategories();
    loadDashboardData();
});

async function loadDashboardData() {
    await loadStats();
    await loadServices();
    await loadBookings();
    await loadProfile();
}

async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/merchants/stats`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const stats = await res.json();
            document.getElementById("statServices").textContent = stats.totalServices;
            document.getElementById("statActiveBookings").textContent = stats.activeBookings;
            document.getElementById("statCompletedBookings").textContent = stats.completedBookings;
            document.getElementById("statEarnings").textContent = "$" + stats.totalEarnings.toFixed(2);
        }
    } catch (err) { console.error("Error loading stats", err); }
}

async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/merchants/profile`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const profile = await res.json();
            document.getElementById("merchantEmail").value = profile.email;
            if(profile.businessName) document.getElementById("businessName").value = profile.businessName;
            if(profile.contactPhone) document.getElementById("contactPhone").value = profile.contactPhone;
            if(profile.logoUrl) {
                document.getElementById("profileLogoUrl").value = profile.logoUrl;
                document.getElementById("profileLogoPreview").src = profile.logoUrl;
            }
        }
    } catch (err) { console.error("Error loading profile", err); }
}

async function loadCategories() {
    const res = await fetch(`${API_URL}/categories`, { headers: { "Authorization": `Bearer ${token}` } });
    if(res.ok) {
        const categories = await res.json();
        const select = document.getElementById("categoryId");
        categories.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    }
}

async function loadServices() {
    try {
        const res = await fetch(`${API_URL}/services/merchant/${user.id}`, { headers: { "Authorization": `Bearer ${token}` } });
        if(res.ok) {
            const services = await res.json();
            const list = document.getElementById("servicesList");
            list.innerHTML = "";
            services.forEach(s => {
                const tr = document.createElement("tr");
                const imgUrl = s.imageUrl || 'https://via.placeholder.com/50';
                tr.innerHTML = `
                    <td><img src="${imgUrl}" class="rounded" style="width:50px; height:50px; object-fit:cover;"></td>
                    <td class="fw-bold">${s.title}</td>
                    <td><span class="badge bg-light text-dark border">${s.category.name}</span></td>
                    <td class="text-success fw-bold">$${s.price.toFixed(2)}</td>
                    <td class="text-muted">${s.duration || 'N/A'}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3 me-2" onclick='openEditModal(${JSON.stringify(s).replace(/'/g, "&#39;")})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="deleteService(${s.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                list.appendChild(tr);
            });
        }
    } catch(err) { console.error("Error loading services", err); }
}

async function loadBookings() {
    try {
        const res = await fetch(`${API_URL}/bookings/merchant`, { headers: { "Authorization": `Bearer ${token}` } });
        if(res.ok) {
            const bookings = await res.json();
            const list = document.getElementById("bookingsList");
            list.innerHTML = "";
            bookings.forEach(b => {
                let badgeClass = "bg-secondary";
                if(b.status === "PENDING") badgeClass = "badge-pending";
                if(b.status === "COMPLETED") badgeClass = "badge-completed";
                if(b.status === "ACCEPTED") badgeClass = "bg-primary";
                if(b.status === "REJECTED") badgeClass = "bg-danger";

                let actionButtons = "";
                if (b.status === "PENDING") {
                    actionButtons = `
                        <button class="btn btn-sm btn-success rounded-pill px-3 me-1" onclick="updateBooking(${b.id}, 'ACCEPTED')">Accept</button>
                        <button class="btn btn-sm btn-danger rounded-pill px-3" onclick="updateBooking(${b.id}, 'REJECTED')">Reject</button>
                    `;
                } else if (b.status === "ACCEPTED") {
                    actionButtons = `<button class="btn btn-sm btn-primary rounded-pill px-3" onclick="updateBooking(${b.id}, 'COMPLETED')">Mark Completed</button>`;
                }

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${b.customer.username}</strong></td>
                    <td>${b.service.title}</td>
                    <td>${new Date(b.scheduledDate).toLocaleDateString()}</td>
                    <td><span class="badge ${badgeClass} px-3 py-2 rounded-pill">${b.status}</span></td>
                    <td class="text-end">${actionButtons}</td>
                `;
                list.appendChild(tr);
            });
        }
    } catch(err) { console.error("Error loading bookings", err); }
}

function openAddModal() {
    document.getElementById("addServiceForm").reset();
    document.getElementById("serviceId").value = "";
    document.getElementById("serviceModalTitle").textContent = "Create New Service";
    document.getElementById("serviceImagePreview").src = "https://via.placeholder.com/200";
    document.getElementById("serviceImageUrl").value = "";
    serviceModal.show();
}

function openEditModal(service) {
    document.getElementById("serviceId").value = service.id;
    document.getElementById("title").value = service.title;
    document.getElementById("categoryId").value = service.category.id;
    document.getElementById("price").value = service.price;
    document.getElementById("description").value = service.description;
    document.getElementById("duration").value = service.duration || "";
    
    document.getElementById("serviceImageUrl").value = service.imageUrl || "";
    document.getElementById("serviceImagePreview").src = service.imageUrl || "https://via.placeholder.com/200";
    
    document.getElementById("serviceModalTitle").textContent = "Edit Service";
    serviceModal.show();
}

async function handleServiceSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("serviceId").value;
    
    const request = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        price: parseFloat(document.getElementById("price").value),
        categoryId: parseInt(document.getElementById("categoryId").value),
        duration: document.getElementById("duration").value,
        imageUrl: document.getElementById("serviceImageUrl").value
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/services/${id}` : `${API_URL}/services`;

    const res = await fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(request)
    });

    if (res.ok) {
        showToast("Service saved successfully!");
        serviceModal.hide();
        loadDashboardData();
    } else {
        alert("Failed to save service");
    }
}

async function deleteService(id) {
    if(!confirm("Are you sure you want to delete this service?")) return;
    const res = await fetch(`${API_URL}/services/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if(res.ok) {
        showToast("Service deleted!");
        loadDashboardData();
    }
}

async function updateBooking(id, status) {
    const res = await fetch(`${API_URL}/bookings/${id}/status?status=${status}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
        showToast("Booking updated to " + status);
        loadDashboardData();
    }
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    const request = {
        businessName: document.getElementById("businessName").value,
        contactPhone: document.getElementById("contactPhone").value,
        logoUrl: document.getElementById("profileLogoUrl").value
    };
    
    const res = await fetch(`${API_URL}/merchants/profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(request)
    });
    
    if (res.ok) {
        showToast("Profile updated successfully!");
    }
}

async function handleFileUpload(e, previewId, hiddenInputId) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    // Optimistic Preview
    const reader = new FileReader();
    reader.onload = (e) => document.getElementById(previewId).src = e.target.result;
    reader.readAsDataURL(file);
    
    try {
        const res = await fetch(`${API_URL}/upload`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }, // Token might be required depending on security config
            body: formData
        });
        
        if (res.ok) {
            const data = await res.json();
            document.getElementById(hiddenInputId).value = data.url;
            showToast("Image uploaded successfully!");
        } else {
            const err = await res.json();
            alert(err.error || "Upload failed");
        }
    } catch(err) {
        console.error(err);
        alert("Upload error");
    }
}

function showToast(message) {
    document.getElementById("toastMessage").textContent = message;
    const toast = new bootstrap.Toast(document.getElementById('liveToast'));
    toast.show();
}
