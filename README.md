# ServiceHub - Multi-Client Website Offering Client Services

A full-stack web application developed as part of the **UCT Full Stack Summer Internship**. ServiceHub is a multi-client service marketplace that enables customers to discover and book services, merchants to manage their offerings, and administrators to oversee the platform.

---

## 🌐 Live Demo

https://servicehub-23330221589.us-central1.run.app/

---

## 📄 Internship Report

ServiceHub_ShaleenJaiswal_USC_UCT.pdf

---

## 🚀 Technology Stack

### Backend
- Java 17
- Spring Boot 3
- Spring MVC
- Spring Data JPA
- Spring Security
- JWT Authentication
- Maven

### Frontend
- HTML5
- CSS3
- Bootstrap 5
- JavaScript

### Database
- MySQL

---

## ✨ Features

- Secure User Authentication (JWT)
- Customer Dashboard
- Merchant Dashboard
- Admin Dashboard
- Service Categories
- Service Listings
- Booking Management
- Ratings & Reviews
- Responsive User Interface
- RESTful API Integration

---

## 📂 Project Structure

```
upskillcampus
│
├── backend
│   ├── src/main/java
│   ├── src/main/resources
│   │   ├── static
│   │   │   ├── css
│   │   │   ├── js
│   │   │   ├── pages
│   │   │   └── index.html
│   │   └── application.properties
│   ├── pom.xml
│   └── Dockerfile
│
├── README.md
└── ServiceHub_ShaleenJaiswal_USC_UCT.pdf
```

---

## ▶️ Running the Project Locally

### 1. Configure MySQL

Create a database (or update `application.properties` with your own database credentials).

### 2. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The application will start on:

```
http://localhost:8080
```

### 3. Access the Application

Open your browser and visit:

```
http://localhost:8080/
```

The frontend is served directly by the Spring Boot application from:

```
src/main/resources/static
```

---

## 👨‍💻 Developer

**Shaleen Jaiswal**

UCT Full Stack Summer Internship Project
