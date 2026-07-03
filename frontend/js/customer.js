const API_URL = "http://localhost:8080/api";
let currentUser = JSON.parse(localStorage.getItem("user"));
let token = localStorage.getItem("token");

if (!token || currentUser.role !== "ROLE_CUSTOMER") {
    alert("Unauthorized!");
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "../login.html";
    });

    loadAllServices();
});

async function loadAllServices() {
    try {
        const res = await fetch(`${API_URL}/services`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const services = await res.json();
        const grid = document.getElementById("servicesGrid");
        grid.innerHTML = "";
        services.forEach(s => {
            grid.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${s.title}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${s.category.name} | $${s.price}</h6>
                            <p class="card-text">${s.description}</p>
                            <p class="card-text"><small>Provider: ${s.merchant.username}</small></p>
                            <button class="btn btn-success w-100" onclick="bookService(${s.id})">Book Now</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (err) { console.error(err); }
}

async function bookService(id) {
    const scheduledDate = prompt("Enter scheduled date (YYYY-MM-DDTHH:MM):", new Date().toISOString().slice(0,16));
    if(!scheduledDate) return;
    
    try {
        const res = await fetch(`${API_URL}/bookings`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ serviceId: id, scheduledDate })
        });
        if(res.ok) {
            alert("Service booked successfully!");
            loadMyBookings();
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
        const grid = document.getElementById("servicesGrid");
        let html = "<h3>My Bookings</h3><table class='table'><tr><th>Service</th><th>Provider</th><th>Status</th><th>Date</th></tr>";
        bookings.forEach(b => {
            html += `<tr><td>${b.service.title}</td><td>${b.merchant.username}</td><td>${b.status}</td><td>${b.scheduledDate}</td></tr>`;
        });
        html += "</table>";
        grid.innerHTML = html;
    } catch(err) { console.error(err); }
}
