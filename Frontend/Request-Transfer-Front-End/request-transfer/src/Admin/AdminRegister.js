import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Authen.css";

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    userName: "",
    workEmail: "",
    password: "",
    iqamaNo: "",
    department: "",
    phoneNumber: "",
    branch: "",
    RoleId: "",
    companyId: "", // Added companyId to form data
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]); // Added companies state

  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!userData || userData.roleId !== 5) {
      navigate("/");
    }
  }, [navigate, userData]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [deptRes, branchRes, roleRes, companyRes] = await Promise.all([
          API.get("/User/departments"),
          API.get("/User/branches"),
          API.get("/User/roles"),
          API.get("/User/company"), // Fetch companies
        ]);

        console.log("Departments:", deptRes.data);
        console.log("Branches:", branchRes.data);
        console.log("Roles:", roleRes.data);
        console.log("Companies:", companyRes.data);

        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
        setCompanies(Array.isArray(companyRes.data) ? companyRes.data : []); // Set companies

        // ✅ roles might come as objects OR strings, normalize safely
        const normalizedRoles = Array.isArray(roleRes.data)
          ? roleRes.data.filter((r) => r && (r.Id || r.id))
          : [];

        setRoles(normalizedRoles);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
    navigate("Auth");
  };

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        RoleId: Number(formData.RoleId), // convert RoleId safely to number
        companyId: Number(formData.companyId), // convert companyId safely to number
      };

      console.log("Submitting payload:", payload);

      const res = await API.post("/User/register", payload);
      toast.success(res.data.message || "User registered successfully!");
      setErrorMsg("");

      // Reset form data
      setFormData({
        userName: "",
        workEmail: "",
        password: "",
        iqamaNo: "",
        department: "",
        phoneNumber: "",
        branch: "",
        RoleId: "",
        companyId: "", // Reset companyId too
      });
    } catch (error) {
      console.error("Error registering user:", error);
      const errorMessage =
        error.response?.data?.message || "Registration failed. Try again.";

      // Check for specific error cases
      if (
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("email already exists")
      ) {
        toast.error(
          "Email already exists. Please use a different email address."
        );
      } else if (
        errorMessage.toLowerCase().includes("iqama") ||
        errorMessage.toLowerCase().includes("iqama already exists") ||
        errorMessage.toLowerCase().includes("national id") ||
        errorMessage.toLowerCase().includes("id already exists")
      ) {
        toast.error(
          "Iqama/National ID already exists. Please use a different Iqama number."
        );
      } else {
        toast.error(errorMessage);
      }

      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  // Get selected company name for display
  const selectedCompanyName =
    companies.find(
      (company) =>
        company.Id === parseInt(formData.companyId) ||
        company.id === parseInt(formData.companyId)
    )?.companyName || "Select Company";

  return (
    <div className="auth-container">
      <button type="button" className="btn-back-top" onClick={handleBack}>
        ← Back to Dashboard
      </button>
      <button className="reg-logout-button" onClick={handleLogout}>
        🚪 Logout        
      </button>

      <div className="auth-form-wrapper">
        <div className="auth-company-header">
          <div className="auth-logo-container">
            <div className="auth-logo">
              <img
                src="/Adma-logo.png"
                alt="Adma Shamran TC"
                className="auth-logo-image"
              />
            </div>
            <div>
              <div className="auth-company-name">Adma Shamran</div>
              <div className="auth-company-subtitle">
                Trading & Catering Co.
              </div>
            </div>
          </div>
        </div>

        <div className="auth-header">
          <h2>Register New User (Admin Only)</h2>
        </div>

        {errorMsg && <div className="auth-error-message">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Full Name</label>
            <input
              className="auth-input"
              name="userName"
              placeholder="Enter full name"
              value={formData.userName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-input-group">
            <label>National / Iqama Number</label>
            <input
              className="auth-input"
              name="iqamaNo"
              placeholder="Enter Iqama number"
              value={formData.iqamaNo}
              onChange={handleChange}
              required
            />
          </div>

          {/* ✅ Department dropdown */}
          <div className="auth-input-group">
            <label>Department</label>
            <select
              className="auth-input auth-select"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.departmentName}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Role dropdown */}
          <div className="auth-input-group">
            <label>Role</label>
            <select
              className="auth-input auth-select"
              name="RoleId"
              value={formData.RoleId || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option
                  key={role.Id || role.id}
                  value={(role.Id || role.id).toString()}
                >
                  {role.roleName || role.name || "Unnamed Role"}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Company dropdown - NEW */}
          <div className="auth-input-group">
            <label>Company</label>
            <select
              className="auth-input auth-select"
              name="companyId"
              value={formData.companyId || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option
                  key={company.Id || company.id}
                  value={(company.Id || company.id).toString()}
                >
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-input-group">
            <label>Phone Number</label>
            <input
              className="auth-input"
              name="phoneNumber"
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* ✅ Branch dropdown */}
          <div className="auth-input-group">
            <label>Branch</label>
            <select
              className="auth-input auth-select"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              required
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.branchName}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-input-group">
            <label>Email Address</label>
            <input
              className="auth-input"
              name="workEmail"
              placeholder="Enter work email"
              value={formData.workEmail}
              onChange={handleChange}
              type="email"
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <div className="auth-password-wrapper">
              <input
                className="auth-input auth-password-input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="auth-toggle-eye"
                onClick={togglePassword}
              >
                {showPassword ? "⊘" : "👁"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register User"}
          </button>
        </form>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
}
