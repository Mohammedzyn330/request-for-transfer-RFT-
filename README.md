# Request For Transfer (RFT) System

## 📌 Overview

The **Request For Transfer (RFT)** system is a full-stack application designed to manage vendor payments and approval workflows across multiple branches.

It includes:

- **.NET Backend (RESTful APIs)**
- **React Frontend**
- **MS SQL Server Database**

The system follows a structured workflow with multiple roles to ensure proper validation, approval, and financial tracking.

---

## 👥 User Roles & Responsibilities

### 1️⃣ Admin

- Create, edit, and delete users
- Manage branches and roles
- Monitor active users in the system
- Dynamically control system structure (branches, roles)

---

### 2️⃣ Branch Accountant

- Create **RFT (Request For Transfer)** forms
- Access only **branch-specific vendors**
- Vendor data imported from backend (via Excel)

#### Features:

- Auto-fill vendor details:
  - Supplier Name
  - Bank Name
  - Bank Account
  - Branch Name

- Input fields:
  - Balance As Per Company
  - Balance As Per Supplier
  - Difference (auto-calculated)
  - Reason of Difference (conditional)
  - Payment Due
  - Remarks

- Upload attachments:
  - Supported: `.jpg`, `.jpeg`, `.png`, `.pdf`
  - Max size: **10MB**

- Track status:
  - Submitted
  - Verified
  - Returned
  - Approved

---

### 3️⃣ Verifier

- View RFT forms from all branches
- Actions:
  - ✅ Verify (if correct)
  - 🔄 Return (with remarks)

#### Workflow:

- Submitted → Verified
- Submitted → Returned → Resubmitted

---

### 4️⃣ Approver (Manager)

- Final authority for RFT approval
- Can:
  - Approve
  - Return
  - Reject

#### Features:

- View all branches’ RFTs

- Priority-based filtering:
  - First Priority
  - Second Priority

- Track:
  - Verification status
  - Finance progress
  - Cash flow (current & future)

- Download attachments

---

### 5️⃣ Finance

- Handles **payment processing**

#### Responsibilities:

- Manage bank positions
- Handle payment requests
- Track payment schedules
- Process approved RFTs

#### Workflow:

1. Receive approved RFT
2. Send for final approval (e.g., WhatsApp to owner)
3. Mark payment as processed
4. Upload payment receipt
5. Enter reference number from external system

#### Tracking:

- Payment progress (%)
- Payment receipt
- Final completion status (100%)

---

## 📂 Project Structure

```
request-for-transfer/
├─ backend/          # .NET Backend (REST APIs)
├─ frontend/         # React Application
├─ database/         # SQL Scripts (optional)
├─ .gitignore
└─ README.md
```

---

## ⚙️ Technologies Used

### Frontend

- React.js
- HTML / CSS
- Axios (API calls)

### Backend

- .NET (RESTful APIs)

### Database

- MS SQL Server

---

## 🚀 How to Run the Project

### 1️⃣ Install Dependencies (Frontend)

```bash
cd frontend
npm install
```

---

### 2️⃣ Configure Backend

Open `appsettings.json` and update connection string:

#### Windows Authentication:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_SERVER;Database=YOUR_DB;Trusted_Connection=True;Encrypt=False;"
}
```

#### SQL Authentication:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_SERVER;Database=YOUR_DB;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=False;"
}
```

---

### 3️⃣ Run Backend

- Open in **Visual Studio 2022**
- Run the project
- Swagger will open (e.g., `http://localhost:5000`)

---

### 4️⃣ Connect Frontend to Backend

- Copy backend URL
- Paste it in frontend API config file

---

### 5️⃣ Run Frontend

```bash
npm start
```

- Runs on: `http://localhost:3000`

---

### 6️⃣ Enable CORS (Backend)

In `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder =>
        {
            builder.WithOrigins("http://localhost:3000")
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        });
});
```

---

## 📎 File Upload Service

- Uses `IFileUploadService` and `FileUploadService`
- Features:
  - File type validation
  - Max size: 10MB
  - Unique file names (GUID)
  - Automatic directory creation
  - Stores file paths in database

---

## 🔄 Workflow Summary

```
Branch Accountant → Verifier → Approver → Finance → Completion
```

- Forms can be **returned at any stage**
- Status updates are tracked dynamically
- Full transparency across all roles

Notes

- Do not upload `.env` or sensitive credentials
- Ensure SQL Server is running before backend
- Keep frontend and backend URLs synced

Author

Mohammed
Full Stack Developer
Specialized in .NET, React, and ERP Systems
