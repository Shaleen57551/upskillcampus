const API_URL = "http://localhost:8080/api/auth";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            
            try {
                const response = await fetch(`${API_URL}/signin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data));
                    
                    if (data.role === "ROLE_MERCHANT") {
                        window.location.href = "merchant/dashboard.html";
                    } else if (data.role === "ROLE_ADMIN") {
                        window.location.href = "admin/dashboard.html";
                    } else {
                        window.location.href = "customer/dashboard.html";
                    }
                } else {
                    showAlert("loginAlert", data.message || "Invalid credentials.");
                }
            } catch (err) {
                showAlert("loginAlert", "Server error. Please try again later.");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const role = document.getElementById("role").value;
            
            try {
                const response = await fetch(`${API_URL}/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password, role })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert("Registration successful! Please login.");
                    window.location.href = "login.html";
                } else {
                    showAlert("registerAlert", data.message || "Registration failed.");
                }
            } catch (err) {
                showAlert("registerAlert", "Server error. Please try again later.");
            }
        });
    }
});

function showAlert(elementId, message) {
    const alertBox = document.getElementById(elementId);
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}
