import React, { useState, useEffect, useMemo } from "react";
import BankPostion from "../BankPostion/BankPostion";
import Amount from "../AmountToPay/Amount";
import Facillity from "../BankFacillities/Facillity";
import API from "../api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../PreparedbyDashboard/PreparerDashboard.css";
import "./Dashboardw.css";

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ newPassword: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (user?.id) {
          const response = await API.get(`/User/${user.id}`);
          setUserDetails(response.data);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user]);

  const resolvedUser = useMemo(
    () => ({
      ...user,
      ...userDetails,
    }),
    [user, userDetails]
  );

  const formMeta = {
    bankposition: {
      badgeClass: "preparer-status-verified",
      shortLabel: "Bank Position",
    },
    amount: {
      badgeClass: "preparer-status-resubmitted",
      shortLabel: "Payment Request",
    },
    facility: {
      badgeClass: "preparer-status-approved",

      shortLabel: "Bank Facility",
    },
  };

  const formTabs = [
    { key: "overview", label: "Overview", icon: "📋" },
    { key: "bankposition", label: "Bank Position", icon: "🏦" },
    { key: "amount", label: "Payment Request", icon: "💰" },
    { key: "facility", label: "Bank Facility", icon: "📄" },
  ];

  const statsCards = [];

  const quickLinks = [
    {
      label: "Payment Completion",
      icon: "💳",
      className: "preparer-create-button",
      onClick: () => navigate("/payment-completion"),
    },
    {
      label: "Payment Schedule",
      icon: "📅",
      className: "preparer-customer-button",
      onClick: () => navigate("/weeklypayments"),
    },
  ];

  const handleTabSelect = (tab) => {
    setActiveTab(tab.key);
    if (tab.key === "overview") {
      setSelectedForm(null);
      return;
    }
    setSelectedForm(tab.key);
  };

  const renderSelectedForm = () => {
    switch (selectedForm) {
      case "bankposition":
        return (
          <BankPostion key="bankposition" user={userDetails || user || {}} />
        );
      case "amount":
        return <Amount key="amount" user={userDetails || user || {}} />;
      case "facility":
        return <Facillity key="facility" user={userDetails || user || {}} />;
      default:
        return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
    navigate("Auth");
  };

  const profileSource = userDetails || user || {};
  const currentUserId =
    userDetails?.id ||
    userDetails?.Id ||
    user?.id ||
    user?.Id ||
    profileSource?.id ||
    profileSource?.Id;

  const handleProfilePasswordChange = (e) => {
    const { value } = e.target;
    setProfileForm((prev) => ({ ...prev, newPassword: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.newPassword.trim()) {
      toast.error("Please enter a new password.");
      return;
    }

    if (!currentUserId) {
      toast.error("Unable to identify your user record.");
      return;
    }

    const baseUser = profileSource;
    const companyIdValue =
      baseUser.companyId ||
      baseUser.CompanyId ||
      user?.companyId ||
      user?.CompanyId;

    const updatePayload = {
      userName: baseUser.userName || baseUser.username || user?.username || "",
      workEmail: baseUser.workEmail || baseUser.email || user?.email || "",
      phoneNumber: baseUser.phoneNumber || user?.phoneNumber || "",
      department: baseUser.department || user?.department || "",
      branch: baseUser.branch || user?.branch || "",
      companyId: companyIdValue ? parseInt(companyIdValue) : undefined,
      newPassword: profileForm.newPassword.trim(),
    };

    setIsUpdatingPassword(true);
    try {
      await API.put(`/User/update-user/${currentUserId}`, updatePayload);
      toast.success("Password updated successfully!");
      setProfileForm({ newPassword: "" });
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to update password."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const closeSidebarOnSmall = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="preparer-loading">Loading your dashboard overview...</div>
    );
  }

  const infoItems = [
    { label: "User", value: resolvedUser.userName || resolvedUser.username },
    { label: "Iqama No", value: resolvedUser.iqamaNo },
    { label: "Email", value: resolvedUser.workEmail },
    { label: "Phone", value: resolvedUser.phoneNumber },
    { label: "Department", value: resolvedUser.department },
    { label: "Branch", value: resolvedUser.branch },
    {
      label: "Role",
      value: resolvedUser.roleName || `Role ID: ${resolvedUser.RoleId || "-"}`,
    },
  ];

  const selectedMeta = selectedForm ? formMeta[selectedForm] : null;
  const selectedFormComponent = renderSelectedForm();

  return (
    <div className="preparer-dashboard-container">
      {!isSidebarOpen && (
        <button
          className="preparer-menu-toggle"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
      )}
      {isSidebarOpen && (
        <div
          className="preparer-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="preparer-dashboard-shell">
        <aside
          className={`preparer-sidebar ${isSidebarOpen ? "open" : "collapsed"}`}
        >
          <button
            className="preparer-sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
          <div>
            <div className="preparer-sidebar-header">
              <h2>Dashboard</h2>
              <p>{resolvedUser.userName || resolvedUser.username || "User"}</p>
            </div>
            <nav className="preparer-sidebar-nav">
              <button
                className="preparer-sidebar-button"
                onClick={() => {
                  navigate("/weeklypayments");
                  closeSidebarOnSmall();
                }}
              >
                📅 Payment Schedule
              </button>
              <button
                className="preparer-sidebar-button"
                onClick={() => {
                  navigate("/payment-completion");
                  closeSidebarOnSmall();
                }}
              >
                💳 Payment Completion
              </button>
              <button
                className={`preparer-sidebar-button ${
                  isProfileOpen ? "active" : ""
                }`}
                onClick={() => setIsProfileOpen((prev) => !prev)}
              >
                👤 Profile
              </button>
            </nav>
            {isProfileOpen && (
              <div className="preparer-profile-card">
                <div className="preparer-profile-grid">
                  {[
                    {
                      label: "Iqama No",
                      value: profileSource?.iqamaNo || "-",
                    },
                    {
                      label: "Phone",
                      value: profileSource?.phoneNumber || "-",
                    },
                    {
                      label: "Department",
                      value: profileSource?.department || "-",
                    },
                    {
                      label: "Branch",
                      value: profileSource?.branch || "-",
                    },
                    {
                      label: "Role",
                      value:
                        profileSource?.roleName ||
                        profileSource?.role ||
                        (profileSource?.RoleId
                          ? `Role ID: ${profileSource.RoleId}`
                          : "-"),
                    },
                  ].map((item) => (
                    <div key={item.label} className="preparer-profile-item">
                      <span className="preparer-profile-label">
                        {item.label}
                      </span>
                      <span className="preparer-profile-value">
                        {item.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
                <form
                  className="preparer-profile-form"
                  onSubmit={handleProfileSubmit}
                >
                  <label
                    className="preparer-profile-form-label"
                    htmlFor="dashboardwaqas-profile-new-password"
                  >
                    New Password
                  </label>
                  <input
                    id="dashboardwaqas-profile-new-password"
                    type="password"
                    className="preparer-profile-input"
                    placeholder="Enter a new password"
                    value={profileForm.newPassword}
                    onChange={handleProfilePasswordChange}
                  />
                  <button
                    type="submit"
                    className="preparer-profile-submit"
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}
          </div>
          <button className="preparer-sidebar-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </aside>

        <div className="preparer-dashboard-main">
          <div className="preparer-dashboard-header">
            <div className="preparer-header-title">
              <h1>Dashboard</h1>
              <p>
                Welcome, <strong>{resolvedUser.userName || resolvedUser.username || "User"}</strong>
              </p>
            </div>
          </div>

          {statsCards.length > 0 && (
            <div className="preparer-stats-grid">
              {statsCards.map((card) => (
                <div key={card.label} className="preparer-stat-card">
                  <h3>{card.label}</h3>
                  <span className={`preparer-stat-value ${card.className || ""}`}>
                    {card.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="preparer-tabs-container">
            <div className="preparer-tabs">
              {formTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`preparer-tab ${
                    activeTab === tab.key ? "active" : ""
                  }`}
                  onClick={() => handleTabSelect(tab)}
                >
                  <span className="dashboardwaqas-tab-icon">{tab.icon}</span>
                  {tab.label}
                  {tab.badge ? (
                    <span className="preparer-tab-count">{tab.badge}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="preparer-entries-container">
            {selectedForm && selectedFormComponent ? (
              <div className="preparer-entry-card dashboardwaqas-form-card">
                <div className="preparer-entry-header">
                  <h3 className="preparer-entry-title">{selectedMeta?.title}</h3>
                  {selectedMeta?.badgeLabel && (
                    <span
                      className={`preparer-status-badge ${
                        selectedMeta.badgeClass || ""
                      } dashboardwaqas-status-badge`}
                    >
                      {selectedMeta.badgeLabel}
                    </span>
                  )}
                </div>
                {selectedMeta?.subtitle && (
                  <p className="dashboardwaqas-form-subtitle">
                    {selectedMeta.subtitle}
                  </p>
                )}
                <div className="dashboardwaqas-form-shell" key={selectedForm}>
                  {selectedFormComponent}
                </div>
              </div>
            ) : (
              <div className="preparer-empty-state">
                <div className="preparer-empty-icon">📁</div>
                <p className="preparer-empty-text">
                  Select a module from the tabs above to begin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Dashboard;
