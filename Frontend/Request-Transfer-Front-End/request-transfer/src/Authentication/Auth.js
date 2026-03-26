import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./Auth.css";
// import { ROLE_ROUTES } from "../RolesConfig/roleConfigs";

export default function Auth({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [userName, setUserName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userIqama, setUserIqama] = useState("");
  const [department, setDepartment] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setErrorMsg("");
    // Clear form fields when toggling
    setUserName("");
    setWorkEmail("");
    setPassword("");
    setUserIqama("");
    setDepartment("");
    setPhoneNumber("");
    setBranch("");
    setRoleId("");
  };

  const togglePassword = () => setShowPassword(!showPassword);

  const handleCreateAccountClick = () => {
    alert(
      "Only administrators can create new accounts. Please contact your system administrator."
    );
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await API.post("/User/Login", {
        workEmail,
        password,
      });

      const data = res.data;
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);

      const roleId = Number(data.roleId);

      if (roleId === 1) navigate("/preparer-dashboard");
      else if (roleId === 2) navigate("/verifier");
      else if (roleId === 3) navigate("/approver");
      else if (roleId === 4) navigate("/dashboard");
      else if (roleId === 5) navigate("/admin/dashboard");
      else alert("No role assigned! Contact admin.");

      setErrorMsg("");
    } catch (error) {
      console.error("Error logging in:", error);
      setErrorMsg(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!workEmail || !password) {
      setErrorMsg("Please fill in all required fields");
      return;
    }

    if (!isRegister) {
      handleLogin();
    } else {
      handleCreateAccountClick();
    }
  };

  // Clear error when user starts typing
  const handleEmailChange = (e) => {
    setWorkEmail(e.target.value);
    if (errorMsg) setErrorMsg("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errorMsg) setErrorMsg("");
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        {/* Company Logo and Name */}
        <div className="auth-company-header">
          <div className="auth-logo-container">
            <div className="auth-logo">
              <img
                src="Adma-logo.png"
                alt="Adma Shamran Catering"
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

        {/* Auth Header */}
        <div className="auth-header">
          <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? "Contact administrator for account creation"
              : "Sign in to your account"}
          </p>
        </div>

        {errorMsg && <div className="auth-error-message">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <div className="auth-input-group">
                <label>Full Name *</label>
                <input
                  className="auth-input"
                  placeholder="Enter your full name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  disabled
                />
              </div>

              <div className="auth-input-group">
                <label>Iqama Number *</label>
                <input
                  className="auth-input"
                  placeholder="Enter your Iqama number"
                  value={userIqama}
                  onChange={(e) => setUserIqama(e.target.value)}
                  required
                  disabled
                />
              </div>

              <div className="auth-input-group">
                <label>Department *</label>
                <input
                  className="auth-input"
                  placeholder="Enter your department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  disabled
                />
              </div>

              <div className="auth-input-group">
                <label>Role *</label>
                <select
                  className="auth-input auth-select"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  required
                  disabled
                >
                  <option value="">Select Your Role</option>
                  <option value="1">FORM PREPARE</option>
                  <option value="2">VERIFIER</option>
                  <option value="3">APPROVER</option>
                  <option value="4">FINANCE</option>
                  <option value="5">ADMIN</option>
                </select>
              </div>

              <div className="auth-input-group">
                <label>Phone Number *</label>
                <input
                  className="auth-input"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled
                />
              </div>

              <div className="auth-input-group">
                <label>Branch *</label>
                <input
                  className="auth-input"
                  placeholder="Enter your branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  disabled
                />
              </div>
            </>
          )}

          <div className="auth-input-group">
            <label>Email Address *</label>
            <input
              className="auth-input"
              placeholder="Enter your work email"
              value={workEmail}
              onChange={handleEmailChange}
              type="email"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label>Password *</label>
            <div className="auth-password-wrapper">
              <input
                className="auth-input auth-password-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="auth-toggle-eye"
                onClick={togglePassword}
                disabled={loading}
              >
                {showPassword ? "🛇" : "👁"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading || !workEmail || !password}
          >
            {loading ? (
              <>
                <div className="auth-spinner"></div>
                Processing...
              </>
            ) : isRegister ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-toggle-section">
          <p className="auth-toggle-text">
            {isRegister
              ? "Already have an account? "
              : "Don't have an account? "}
            <span
              className="auth-toggle-link"
              onClick={isRegister ? toggleForm : handleCreateAccountClick}
            >
              {isRegister ? "Sign In" : "Contact Administrator"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
