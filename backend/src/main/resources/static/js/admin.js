const API_URL = "/api";
let currentUser = JSON.parse(localStorage.getItem("user"));
let token = localStorage.getItem("token");
let categoryModal;

if (!token || currentUser.role !== "ROLE_ADMIN") {
    alert("Unauthorized! Admin access only.");
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("userGreeting").innerHTML = `Hello, <strong>${currentUser.username}</strong>`;
    
    categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    
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
        localStorage.clear();
        window.location.href = "../login.html";
    });

    document.getElementById("categoryForm").addEventListener("submit", handleCategorySubmit);

    loadDashboardData();
});

async function loadDashboardData() {
    loadStats();
    loadUsers();
    loadCategories();
    loadBookingsAndReviews();
}

async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/admin/stats`, { headers: { "Authorization": `Bearer ${token}` } });
        if(res.ok) {
            const stats = await res.json();
            document.getElementById("statUsers").textContent = stats.totalUsers;
            document.getElementById("statBookings").textContent = stats.totalBookings;
            document.getElementById("statReviews").textContent = stats.totalReviews;
        }
    } catch(e) { console.error(e); }
}

async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/admin/users`, { headers: { "Authorization": `Bearer ${token}` } });
        if(res.ok) {
            const users = await res.json();
            const list = document.getElementById("usersList");
            list.innerHTML = "";
            users.forEach(u => {
                let badge = u.role === 'ROLE_ADMIN' ? 'bg-danger' : (u.role === 'ROLE_MERCHANT' ? 'bg-primary' : 'bg-success');
                list.innerHTML += `
                    <tr>
                        <td>${u.id}</td>
                        <td class="fw-bold">${u.username}</td>
                        <td>${u.email}</td>
                        <td><span class="badge ${badge}">${u.role}</span></td>
                        <td class="text-end">
                            ${u.role !== 'ROLE_ADMIN' ? `<button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i> Delete</button>` : ''}
                        </td>
                    </tr>
                `;
            });
        }
    } catch(e) { console.error(e); }
}

async function deleteUser(id) {
    if(!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`${API_URL}/admin/users/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
    if(res.ok) loadUsers();
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`); // Public API
        if(res.ok) {
            const categories = await res.json();
            const list = document.getElementById("categoriesList");
            list.innerHTML = "";
            categories.forEach(c => {
                list.innerHTML += `
                    <tr>
                        <td>${c.id}</td>
                        <td class="fw-bold">${c.name}</td>
                        <td>${c.description}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-primary rounded-pill me-1" onclick='openEditCategory(${JSON.stringify(c).replace(/'/g, "&#39;")})'><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteCategory(${c.id})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch(e) { console.error(e); }
}

function openCategoryModal() {
    document.getElementById("categoryForm").reset();
    document.getElementById("categoryId").value = "";
    document.getElementById("categoryModalTitle").textContent = "Add Category";
    categoryModal.show();
}

function openEditCategory(cat) {
    document.getElementById("categoryId").value = cat.id;
    document.getElementById("catName").value = cat.name;
    document.getElementById("catDesc").value = cat.description;
    document.getElementById("categoryModalTitle").textContent = "Edit Category";
    categoryModal.show();
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    const id = document.getElementById("categoryId").value;
    const data = {
        name: document.getElementById("catName").value,
        description: document.getElementById("catDesc").value
    };
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/categories/${id}` : `${API_URL}/categories`;
    
    const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if(res.ok) {
        categoryModal.hide();
        loadCategories();
    }
}

async function deleteCategory(id) {
    if(!confirm("Are you sure you want to delete this category?")) return;
    const res = await fetch(`${API_URL}/categories/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
    if(res.ok) loadCategories();
}

async function loadBookingsAndReviews() {
    try {
        const bRes = await fetch(`${API_URL}/admin/bookings`, { headers: { "Authorization": `Bearer ${token}` } });
        if(bRes.ok) {
            const bookings = await bRes.json();
            const list = document.getElementById("globalBookingsList");
            list.innerHTML = "";
            bookings.forEach(b => {
                list.innerHTML += `<tr><td>${b.customer.username}</td><td>${b.merchant.username}</td><td>${b.service.title}</td><td><span class="badge bg-secondary">${b.status}</span></td></tr>`;
            });
        }
        
        const rRes = await fetch(`${API_URL}/admin/reviews`, { headers: { "Authorization": `Bearer ${token}` } });
        if(rRes.ok) {
            const reviews = await rRes.json();
            const list = document.getElementById("globalReviewsList");
            list.innerHTML = "";
            reviews.forEach(r => {
                let stars = '⭐'.repeat(r.rating);
                list.innerHTML += `<tr><td>${stars}</td><td><small>${r.comment}</small></td><td><button class="btn btn-sm btn-danger px-2 py-0" onclick="deleteReview(${r.id})">X</button></td></tr>`;
            });
        }
    } catch(e) { console.error(e); }
}

async function deleteReview(id) {
    if(!confirm("Delete this review?")) return;
    const res = await fetch(`${API_URL}/admin/reviews/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
    if(res.ok) loadBookingsAndReviews();
}
