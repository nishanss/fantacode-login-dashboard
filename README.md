# **Login & Dashboard Mini Project**

This project demonstrates a simple login and dashboard application, using both .NET Core backend development and Angular frontend development.

## **Table of Contents**

1. [Objective](https://www.google.com/search?q=%23objective)  
2. [Features](https://www.google.com/search?q=%23features)  
3. [Project Structure](https://www.google.com/search?q=%23project-structure)  
4. [Prerequisites](https://www.google.com/search?q=%23prerequisites)  
5. [Setup Instructions](https://www.google.com/search?q=%23setup-instructions)  
   * [Backend Setup](https://www.google.com/search?q=%23backend-setup)  
   * [Frontend Setup](https://www.google.com/search?q=%23frontend-setup)  
6. [Usage](https://www.google.com/search?q=%23usage)  
7. [Design for Distributed Environment / Horizontal Scaling](https://www.google.com/search?q=%23design-for-distributed-environment--horizontal-scaling)  
8. [Troubleshooting Tips](https://www.google.com/search?q=%23troubleshooting-tips)  
9. [Future Enhancements](https://www.google.com/search?q=%23future-enhancements)

## **Objective**

The primary objective of this project is to build a basic login and dashboard application to demonstrate proficiency in full-stack development using .NET Core for the backend API and Angular for the frontend.

## **Features**

* **Login Page:**  
  * User authentication with username and password fields.  
  * Redirection to the dashboard page upon successful login.  
  * Display of basic error messages for invalid login attempts.  
  * Rate-limiting mechanism implemented on the login API to prevent brute-force attacks.  
  * Authentication token (JWT) generation on successful login.  
* **Dashboard Page:**  
  * Accessible only after successful authentication.  
  * Displays a bar chart using @swimlane/ngx-charts.  
  * Chart data is fetched from a protected backend API endpoint (hardcoded sales data for demonstration).  
  * Logout functionality.

## **Project Structure**

The project is divided into two main parts:

* backend/FantacodeLoginDashboard: Contains the .NET Core Web API project.  
* frontend/FantacodeFrontend: Contains the Angular application.

fantacode-login-dashboard/  
├── backend/  
│   └── FantacodeAuthApi/  
│       ├── Controllers/  
│       │   └── AuthController.cs  
│       ├── appsettings.json  
│       ├── Program.cs  
│       └── ... (other .NET project files)  
└── frontend/  
    └── FantacodeFrontend/  
        ├── src/  
        │   ├── app/  
        │   │   ├── app-routing.module.ts  
        │   │   ├── app.component.ts  
        │   │   ├── app.module.ts  
        │   │   ├── dashboard/  
        │   │   │   ├── dashboard.component.html  
        │   │   │   ├── dashboard.component.scss  
        │   │   │   └── dashboard.component.ts  
        │   │   ├── login/  
        │   │   │   ├── login.component.html  
        │   │   │   ├── login.component.scss  
        │   │   │   └── login.component.ts  
        │   │   ├── services/  
        │   │   │   └── auth.service.ts 
        │   │   └── interceptors/  
        │   │       └── auth.interceptor.ts   
        │   └── styles.scss  
        ├── angular.json  
        ├── package.json  
        ├── postcss.config.js  
        ├── tailwind.config.js  
        └── ...

## **Prerequisites**

Before you begin, ensure you have the following installed on your system:

* **Node.js and npm:**  
  * Node.js v18+ (preferably installed via NVM for WSL users for better path management).  
  * npm (comes with Node.js).  
* **.NET SDK:** .NET 8.0 SDK (or compatible version).  
* **Code Editor:** Visual Studio Code (recommended) or any other.

## **Setup Instructions**

Follow these steps to get the backend and frontend running on your local machine.

### **Backend Setup**

1. **Navigate to the backend project directory:**  
   cd fantacode-login-dashboard/backend/FantacodeLoginDashboard

2. **Restore .NET dependencies:**  
   dotnet restore

3. **Run the backend API:**  
   dotnet run

   The API will typically run on http://localhost:5289 (or a similar port). Keep this terminal window open.

### **Frontend Setup**

1. **Navigate to the frontend project directory:**  
   cd fantacode-login-dashboard/frontend/FantacodeFrontend

2. **Install Node.js dependencies:**  
   npm install

   This command will install all Angular, Tailwind CSS, and charting library dependencies.  
   * **Note if you used WSL like I did:** If you encounter npm ERR\! could not determine executable to run or Cannot find module errors, ensure node\_modules and package-lock.json are completely removed (even manually via Windows Explorer \\\\wsl$\\Ubuntu\\root\\your-project-path) before running npm install.  
3. **Start the Angular development server:**  
   ng serve

   The Angular application will typically run on http://localhost:4200. Keep this terminal window open.

## **Usage**

1. Ensure both the .NET backend (dotnet run) and Angular frontend (ng serve) are running.  
2. Open your web browser and navigate to http://localhost:4200/.  
3. You will be presented with the login page. Use the following credentials:  
   * **Username:** user1  
   * **Password:** password123  
4. Upon successful login, you will be redirected to the Dashboard page, displaying the hardcoded sales data in a bar chart.  
5. Click the "Logout" button to return to the login page.

## **Design for Distributed Environment / Horizontal Scaling**

The application is designed with horizontal scaling in mind, addressing the problem statement of deployment in a distributed environment with multiple instances.

1. **Stateless Backend (JWT Authentication):**  
   * The .NET Core backend is designed to be **stateless**. After a user logs in, it issues a JSON Web Token (JWT). This token contains all necessary user information (e.g., user ID, roles) signed by the server's secret key.  
   * Subsequent authenticated requests from the frontend include this JWT in the Authorization header.  
   * Any backend instance can validate the JWT using the shared secret key (configured in appsettings.json). This means user sessions are not tied to a specific server instance. Load balancers can distribute requests across any available backend instance, and the session will remain valid.  
   * **Shared Secret Key:** The JWT secret key (JwtSettings:SecretKey in appsettings.json) must be identical across all deployed backend instances. In a production environment, this would be managed securely (e.g., via environment variables, Azure Key Vault, AWS Secrets Manager, Kubernetes Secrets) rather than directly in appsettings.json.  
2. **Client-Side Session Management:**  
   * The authentication token (jwt\_token) is stored in the browser's localStorage on the frontend. This means the client (browser) is responsible for maintaining the session state, not the server. This further supports stateless backend instances.  
3. **Rate Limiting (Distributed Cache Consideration):**  
   * The AspNetCoreRateLimit library is used for rate limiting the login API.  
   * By default, AspNetCoreRateLimit uses an in-memory cache (MemoryCacheRateLimitCounterStore). **For a distributed environment, this would need to be replaced with a distributed cache store** (e.g., Redis, SQL Server, Azure Cache for Redis) to ensure rate limits are consistent across all instances. If one instance sees 5 login attempts, another instance must also count those 5 attempts to prevent bypassing the limit by hitting different servers. Redis was planned, but not used due to unneeded complexity. 
   * The Program.cs is configured to easily swap out the IRateLimitCounterStore and IIpPolicyStore implementations.  
4. **CORS Configuration:**  
   * CORS is explicitly configured in Program.cs to allow requests from the Angular frontend's origin (http://localhost:4200). In a production distributed environment, this origin would be updated to the actual domain(s) where your frontend is hosted.  
5. **Horizontal Scaling Readiness:**  
   * Both the Angular frontend and .NET Core backend are designed to be **horizontally scalable**.  
     * **Frontend:** Angular applications are served as static files (HTML, CSS, JS) and can be deployed to any static file hosting service (e.g., Nginx, Apache, Azure Static Web Apps, AWS S3 \+ CloudFront) behind a CDN for global distribution and low latency.  
     * **Backend:** .NET Core applications are lightweight and can be easily containerized (e.g., Docker) and deployed to container orchestration platforms (e.g., Kubernetes, Azure Kubernetes Service, AWS ECS) or serverless compute (e.g., Azure App Service, AWS Lambda with API Gateway). These platforms inherently support horizontal scaling by adding more instances as demand increases.

## **Troubleshooting Tips**

* **"Server returned code 0, body was: \[object ProgressEvent\]" or CORS errors:**  
  * Ensure your .NET backend is running (dotnet run).  
  * Verify the apiUrl in src/app/services/auth.service.ts matches the backend's actual port.  
  * Check the CORS configuration in backend/FantacodeLoginDashboard/Program.cs to ensure http://localhost:4200 is allowed.  
* **Frontend compilation errors (e.g., TS-996008: Component is standalone... or dependency resolution issues):**  
  * **Perform a clean reinstall:**  
    1. Stop ng serve (Ctrl+C).  
    2. Close all WSL terminals.  
    3. Manually delete node\_modules and package-lock.json from frontend/FantacodeFrontend.  
    4. Open a fresh WSL terminal.  
    5. Navigate to frontend/FantacodeFrontend.  
    6. Run npm cache clean \--force.  
    7. Run ng cache clean \--force.  
    8. Run npm install.  
  * Ensure standalone: false is present in your component decorators if you are declaring them in an NgModule.  
* **"Invalid data format received from backend." on Dashboard:**  
  * Verify the Dashboard() method in AuthController.cs is returning data with Labels (list of strings) and Values (list of integers).

## **Future Enhancements**

* **Database Integration:** Replace dummy user data and dashboard data with a real database (e.g., SQL Server, PostgreSQL, MongoDB).  
* **User Registration:** Add a user registration page.  
* **Robust Error Handling:** Implement more sophisticated global error handling on both frontend and backend.  
* **Environment Configuration:** Use environment-specific configuration files for API URLs and JWT settings (e.g., environment.ts in Angular, appsettings.Development.json in .NET).  
* **Token Refresh:** Implement JWT token refreshing for long-lived sessions.  
* **Distributed Cache for Rate Limiting:** Replace MemoryCacheRateLimitCounterStore with a distributed cache (e.g., Redis) for production deployments.  
* **Logging:** Integrate a robust logging framework (e.g., Serilog for .NET, Log4j for Angular) for better monitoring.  
* **Unit and Integration Tests:** Add comprehensive tests for both frontend and backend.  
* **Containerization (Docker):** Create Dockerfiles for both frontend and backend for easier deployment.