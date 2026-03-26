import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]); // Added companies state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || userData.roleId !== 5) {
      navigate("/");
      return;
    }
    fetchInitialData();
  }, [navigate]);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchDepartments(),
        fetchBranches(),
        fetchCompanies(), // Added companies fetch
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await API.get("/User/all-users");
      const normalizedUsers = response.data.map((u) => ({
        ...u,
        Id: u.id,
        RoleId: u.roleId,
        roleName: u.roleName || u.rolename,
        companyId: u.companyId,
        companyName: u.companyName || "No Company", // Add companyName
      }));
      setUsers(normalizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await API.get("/User/roles");
      const normalizedRoles = response.data.map((r) => ({
        ...r,
        Id: r.id || r.Id,
        roleName: r.roleName,
      }));
      setRoles(normalizedRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await API.get("/User/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await API.get("/User/branches");
      setBranches(response.data);
    } catch (error) {
      console.error("Error fetching branches:", error);
      throw error;
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await API.get("/User/company");
      const normalizedCompanies = response.data.map((c) => ({
        ...c,
        Id: c.id || c.Id,
        companyName: c.companyName,
      }));
      setCompanies(normalizedCompanies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }
  };

  const handleRoleUpdate = async (userId, newRoleId) => {
    if (!userId || !newRoleId) {
      console.error("Invalid user ID or role ID:", { userId, newRoleId });
      alert("Invalid user ID or role selection");
      return;
    }

    setUpdatingUserId(userId);
    try {
      // Send update request
      await API.put(`/User/update-role/${userId}`, {
        roleId: parseInt(newRoleId),
      });

      // Find the role name from your roles list
      const newRole = roles.find((r) => r.Id === parseInt(newRoleId));
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.Id === userId
            ? {
                ...user,
                RoleId: newRoleId,
                roleName: newRole?.roleName || user.roleName,
              }
            : user
        )
      );

      alert("Role updated successfully!");
    } catch (error) {
      console.error("Error updating role:", error);
      alert(
        "Failed to update role: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEditUser = (user) => {
    // FIX: Check if user has valid ID
    if (!user.Id) {
      console.error("User ID is missing:", user);
      alert("Error: User ID is missing");
      return;
    }

    setEditingUser({
      ...user,
      companyId: user.companyId || "", // Ensure companyId is set
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser || !editingUser.Id) {
      alert("User ID is missing");
      return;
    }

    try {
      // Create a clean update object with only the fields that changed
      const updateData = {
        userName: editingUser.userName,
        workEmail: editingUser.workEmail,
        phoneNumber: editingUser.phoneNumber,
        department: editingUser.department,
        branch: editingUser.branch,
        companyId: editingUser.companyId
          ? parseInt(editingUser.companyId)
          : undefined,
      };

      // Only include newPassword if it's provided and not empty
      if (editingUser.newPassword && editingUser.newPassword.trim() !== "") {
        updateData.newPassword = editingUser.newPassword;
      }

      console.log("Updating user:", editingUser.Id, updateData);

      await API.put(`/User/update-user/${editingUser.Id}`, updateData);

      // Update local state with new data including company name
      const updatedCompany = companies.find(
        (c) =>
          c.Id === parseInt(editingUser.companyId) ||
          c.id === parseInt(editingUser.companyId)
      );

      setUsers(
        users.map((user) =>
          user.Id === editingUser.Id
            ? {
                ...user,
                ...updateData,
                companyName: updatedCompany?.companyName || user.companyName,
              }
            : user
        )
      );
      alert("User updated successfully!");
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert(
        "Failed to update user: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleInputChange = (field, value) => {
    setEditingUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegisterUser = () => {
    navigate("/admin/register");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
    navigate("Auth");
  };

  // Get company name for display
  const getCompanyName = (companyId) => {
    const company = companies.find(
      (c) => c.Id === companyId || c.id === companyId
    );
    return company?.companyName || "No Company";
  };

  if (loading) return <div className="admin-loading">Loading users...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-header-buttons">
          <button className="btn-register-user" onClick={handleRegisterUser}>
            Register New User
          </button>
          <button className="preparer-logout-button" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="users-summary">
        <div className="summary-card">
          <h3>Total Users</h3>
          <p className="summary-count">{users.length}</p>
        </div>
        {/* <div className="summary-card">
          <h3>Total Companies</h3>
          <p className="summary-count">{companies.length}</p>
        </div> */}
      </div>

      <div className="users-table-container">
        <h2>User Management</h2>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Branch</th>
              <th>Phone</th>
              <th>Company</th> {/* Added Company column */}
              <th>Current Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.Id}>
                <td>{user.userName}</td>
                <td>{user.workEmail}</td>
                <td>{user.department}</td>
                <td>{user.branch}</td>
                <td>{user.phoneNumber}</td>
                <td>
                  <span className="company-badge">
                    {user.companyName || getCompanyName(user.companyId)}
                  </span>
                </td>
                <td>
                  <span className={`role-badge role-${user.RoleId}`}>
                    {user.roleName}
                  </span>
                </td>
                <td>
                  <div className="actions-container">
                    <select
                      value={user.RoleId || ""}
                      onChange={(e) => {
                        const newRoleId = parseInt(e.target.value);
                        if (newRoleId && user.Id) {
                          handleRoleUpdate(user.Id, newRoleId);
                        }
                      }}
                      disabled={updatingUserId === user.Id}
                      className="role-select"
                    >
                      <option value="">Select New Role</option>
                      {roles.map((role) => (
                        <option key={role.Id} value={role.Id}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn-edit-user"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit Details
                    </button>
                    {updatingUserId === user.Id && "Updating..."}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div className="no-users">No users found</div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit User Details</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editingUser.userName || ""}
                  onChange={(e) =>
                    handleInputChange("userName", e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.workEmail || ""}
                  onChange={(e) =>
                    handleInputChange("workEmail", e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  value={editingUser.phoneNumber || ""}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Department:</label>
                <select
                  value={editingUser.department || ""}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
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

              <div className="form-group">
                <label>Branch:</label>
                <select
                  value={editingUser.branch || ""}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
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

              {/* Added Company dropdown in edit modal */}
              <div className="form-group">
                <label>Company:</label>
                <select
                  value={editingUser.companyId || ""}
                  onChange={(e) =>
                    handleInputChange("companyId", e.target.value)
                  }
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

              <div className="form-group">
                <label>New Password (leave blank to keep current):</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  onChange={(e) =>
                    handleInputChange("newPassword", e.target.value)
                  }
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
