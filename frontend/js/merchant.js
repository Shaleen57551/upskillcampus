const API_URL = "http://localhost:8080/api";
let currentUser = JSON.parse(localStorage.getItem("user"));
let token = localStorage.getItem("token");

if (!token || currentUser.role !== "ROLE_MERCHANT") {
    alert("Unauthorized!");
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "../login.html";
    });

    loadCategories();
    loadServices();

    document.getElementById("addServiceForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("title").value;
        const categoryId = document.getElementById("categoryId").value;
        const price = document.getElementById("price").value;
        const description = document.getElementById("description").value;

        try {
            const res = await fetch(`${API_URL}/services`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title, categoryId, price, description })
            });
            if (res.ok) {
                alert("Service added!");
                window.location.reload();
            } else {
                alert("Failed to add service.");
            }
        } catch (err) {
            console.error(err);
        }
    });
});

async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const cats = await res.json();
        const select = document.getElementById("categoryId");
        cats.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    } catch (err) { console.error(err); }
}

async function loadServices() {
    try {
        const res = await fetch(`${API_URL}/services/merchant/${currentUser.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const services = await res.json();
        const list = document.getElementById("servicesList");
        list.innerHTML = "";
        services.forEach(s => {
            list.innerHTML += `
                <tr>
                    <td>${s.title}</td>
                    <td>${s.category.name}</td>
                    <td>$${s.price}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteService(${s.id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) { console.error(err); }
}

async function deleteService(id) {
    if(!confirm("Delete this service?")) return;
    try {
        const res = await fetch(`${API_URL}/services/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if(res.ok) loadServices();
        else alert("Failed to delete.");
    } catch (err) { console.error(err); }
}
