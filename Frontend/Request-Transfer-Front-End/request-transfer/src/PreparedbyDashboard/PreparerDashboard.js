import React, { useState, useEffect, useMemo } from "react";
import API from "../api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./PreparerDashboard.css";

export default function PreparerDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [myEntries, setMyEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [userDetails, setUserDetails] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ newPassword: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  // Fetch all entries (without filters)
  const fetchMyEntries = async () => {
    try {
      const res = await API.get(`/Preparedby/my-entries/${user.id}`);
      setAllEntries(res.data); // Store all entries
      setMyEntries(res.data); // Initially show all entries
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Failed to load your entries.");
    } finally {
      setLoading(false);
    }
  };

  // Apply date filters client-side
  const applyFilters = () => {
    setLoading(true);

    let filtered = [...allEntries];

    // Apply date filter
    if (dateFilter.fromDate) {
      const fromDate = new Date(dateFilter.fromDate);
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.preparedByCreatedDate);
        return entryDate >= fromDate;
      });
    }

    if (dateFilter.toDate) {
      const toDate = new Date(dateFilter.toDate);
      toDate.setHours(23, 59, 59, 999); // Include entire end date
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.preparedByCreatedDate);
        return entryDate <= toDate;
      });
    }

    setMyEntries(filtered);
    setLoading(false);
    toast.success(`Filters applied! Found ${filtered.length} entries.`);
  };

  // Clear filters
  const clearFilters = () => {
    setDateFilter({
      fromDate: "",
      toDate: "",
    });
    setMyEntries(allEntries); // Reset to show all entries
    toast.info("Filters cleared");
  };

  // Handle date filter changes
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Download file function
  const downloadFile = async (attachmentId, fileName) => {
    try {
      const response = await API.get(
        `/Preparedby/download-attachment/${attachmentId}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`✅ Downloading ${fileName}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("❌ Failed to download file.");
    }
  };

  // Remove file from entry (mark for deletion)
  const removeFile = (fileId, fileName) => {
    setFilesToDelete((prev) => [...prev, { id: fileId, name: fileName }]);
    toast.info(
      `🗑️ ${fileName} marked for removal. It will be deleted when you save changes.`
    );
  };

  // Add new files for upload
  const handleNewFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setNewFiles((prev) => [...prev, ...files]);
    toast.info(
      `📎 ${files.length} file(s) selected. They will be uploaded when you save changes.`
    );
    e.target.value = "";
  };

  // Remove new file from upload list
  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload new files and delete marked files
  const handleFileOperations = async (entryId) => {
    let successCount = 0;
    let errorCount = 0;

    if (newFiles.length > 0) {
      setIsUploading(true);
      try {
        for (const file of newFiles) {
          const formData = new FormData();
          formData.append("File", file);
          formData.append("UploadedByUserId", user.id);

          await API.post(`/Preparedby/upload-attachment/${entryId}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          successCount++;
        }
      } catch (error) {
        console.error("Error uploading files:", error);
        errorCount++;
      }
    }

    if (filesToDelete.length > 0) {
      try {
        for (const file of filesToDelete) {
          await API.delete(`/Preparedby/remove-attachment/${file.id}`);
          successCount++;
        }
      } catch (error) {
        console.error("Error deleting files:", error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(
        `✅ ${successCount} file operation(s) completed successfully!`
      );
    }
    if (errorCount > 0) {
      toast.error(`❌ ${errorCount} file operation(s) failed.`);
    }

    setNewFiles([]);
    setFilesToDelete([]);
    setIsUploading(false);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpdateEntry = async (entryId, updatedData) => {
    try {
      console.log("📤 Updating entry:", entryId, updatedData);

      const response = await API.put(
        `/Preparedby/update/${entryId}`,
        updatedData
      );

      console.log("✅ Update successful:", response.data);

      if (newFiles.length > 0 || filesToDelete.length > 0) {
        await handleFileOperations(entryId);
      }

      toast.success("✅ Entry updated successfully!");
      setEditingEntry(null);
      fetchMyEntries(); // Refresh data
    } catch (error) {
      console.error("❌ Error updating entry:", error);
      if (error.response?.data) {
        toast.error(`❌ ${error.response.data}`);
      } else {
        toast.error("❌ Failed to update entry.");
      }
    }
  };

  const canEditEntry = (entry) => {
    const editableStatuses = ["Returned", "Rejected-By-Approver"];
    return editableStatuses.includes(entry.currentStatus);
  };

  // Fetching user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (user && user.id) {
          const response = await API.get(`/User/${user.id}`);
          setUserDetails(response.data);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user details");
      }
    };

    fetchUserDetails();
  }, [user]);

  const quickResubmit = async (entryId) => {
    try {
      const entry = myEntries.find((e) => e.id === entryId);
      if (entry) {
        const updatedData = {
          balanceAsPerAdmaShamran: entry.balanceAsPerAdmaShamran,
          balanceAsPerSupplier: entry.balanceAsPerSupplier,
          reasonOFDifference: entry.reasonOFDifference,
          paymentDue: entry.paymentDue,
          remarks: entry.remarks,
        };
        await handleUpdateEntry(entryId, updatedData);
      }
    } catch (error) {
      console.error("Error resubmitting:", error);
      toast.error("❌ Failed to resubmit entry.");
    }
  };

  const startEditing = (entry) => {
    setEditingEntry(entry.id);
    setEditFormData({
      balanceAsPerAdmaShamran: entry.balanceAsPerAdmaShamran,
      balanceAsPerSupplier: entry.balanceAsPerSupplier,
      reasonOFDifference: entry.reasonOFDifference,
      paymentDue: entry.paymentDue,
      remarks: entry.remarks,
    });
    setNewFiles([]);
    setFilesToDelete([]);
    // Automatically expand card when editing
    if (!expandedCards.has(entry.id)) {
      setExpandedCards((prev) => new Set([...prev, entry.id]));
    }
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setEditFormData({});
    setNewFiles([]);
    setFilesToDelete([]);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
    navigate("Auth");
  };

  const closeSidebarOnSmall = () => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setIsSidebarOpen(false);
    }
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

  // Calculate difference reactively using useMemo
  const calculateEditDifference = useMemo(() => {
    const admaBalance = parseFloat(editFormData.balanceAsPerAdmaShamran || 0);
    const supplierBalance = parseFloat(editFormData.balanceAsPerSupplier || 0);

    // Calculate absolute difference from both sides
    const diff = Math.abs(supplierBalance - admaBalance);

    return diff.toFixed(2);
  }, [editFormData.balanceAsPerAdmaShamran, editFormData.balanceAsPerSupplier]);

  const getFilteredEntries = () => {
    switch (activeTab) {
      case "submitted":
        return myEntries.filter((e) => e.currentStatus === "Submitted");
      case "resubmitted":
        return myEntries.filter((e) => e.currentStatus === "Re-Submitted");
      case "returned":
        return myEntries.filter((e) => e.currentStatus === "Returned");
      case "verified":
        return myEntries.filter(
          (e) =>
            e.currentStatus === "Verified" ||
            e.currentStatus === "Verified Successfully"
        );
      case "approved":
        return myEntries.filter((e) => e.currentStatus === "Approved");
      case "rejected":
        return myEntries.filter(
          (e) =>
            e.currentStatus === "Rejected-By-Approver" ||
            e.currentStatus === "Rejected-by-Approver"
        );
      default:
        return myEntries;
    }
  };

  const getTabCounts = () => ({
    all: myEntries.length,
    submitted: myEntries.filter((e) => e.currentStatus === "Submitted").length,
    resubmitted: myEntries.filter((e) => e.currentStatus === "Re-Submitted")
      .length,
    returned: myEntries.filter((e) => e.currentStatus === "Returned").length,
    verified: myEntries.filter(
      (e) =>
        e.currentStatus === "Verified" ||
        e.currentStatus === "Verified Successfully"
    ).length,
    approved: myEntries.filter((e) => e.currentStatus === "Approved").length,
    rejected: myEntries.filter(
      (e) =>
        e.currentStatus === "Rejected-By-Approver" ||
        e.currentStatus === "Rejected-by-Approver"
    ).length,
  });

  useEffect(() => {
    if (user) {
      fetchMyEntries();
    }
  }, [user]);

  if (loading)
    return <div className="preparer-loading">Loading your entries...</div>;

  const counts = getTabCounts();
  const filteredEntries = getFilteredEntries();

  const getStatusClass = (status) => {
    const statusMap = {
      Returned: "preparer-status-returned",
      Submitted: "preparer-status-submitted",
      "Re-Submitted": "preparer-status-resubmitted",
      Verified: "preparer-status-verified",
      "Verified Successfully": "preparer-status-verified",
      Approved: "preparer-status-approved",
      Rejected: "preparer-status-rejected",
      "Rejected-by-Approver": "preparer-status-rejected",
    };
    return statusMap[status] || "preparer-status-submitted";
  };

  // File attachment component for view mode
  const FileAttachments = ({ attachments }) => {
    if (!attachments || attachments.length === 0) {
      return (
        <div className="preparer-no-attachments">
          <p>📎 No files attached</p>
        </div>
      );
    }

    return (
      <div className="preparer-attachments-section">
        <p className="preparer-attachments-title">
          📁 Attached Files ({attachments.length})
        </p>
        <div className="preparer-attachments-list">
          {attachments.map((file) => (
            <div key={file.id} className="preparer-attachment-item">
              <div className="preparer-attachment-info">
                <span className="preparer-attachment-name">
                  {file.fileName}
                </span>
                <span className="preparer-attachment-size">
                  {formatFileSize(file.fileSize)}
                </span>
                <span className="preparer-attachment-date">
                  {new Date(file.uploadDate).toLocaleDateString()}
                </span>
              </div>
              <button
                className="preparer-download-button"
                onClick={() => downloadFile(file.id, file.fileName)}
                title="Download file"
              >
                ⬇️ Download
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // File attachment component for edit mode
  const EditFileAttachments = ({ attachments, entryId }) => {
    const existingFiles = attachments || [];
    const filesMarkedForDeletion = filesToDelete.map((f) => f.id);
    const remainingFiles = existingFiles.filter(
      (file) => !filesMarkedForDeletion.includes(file.id)
    );

    return (
      <div className="preparer-edit-attachments-section">
        <h4 className="preparer-edit-attachments-title">
          📁 Manage Attachments
        </h4>

        {remainingFiles.length > 0 && (
          <div className="preparer-existing-files">
            <p className="preparer-files-subtitle">Current Files:</p>
            <div className="preparer-edit-attachments-list">
              {remainingFiles.map((file) => (
                <div key={file.id} className="preparer-edit-attachment-item">
                  <div className="preparer-edit-attachment-info">
                    <span className="preparer-edit-attachment-name">
                      {file.fileName}
                    </span>
                    <span className="preparer-edit-attachment-size">
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span className="preparer-edit-attachment-date">
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="preparer-edit-attachment-actions">
                    <button
                      className="preparer-download-button"
                      onClick={() => downloadFile(file.id, file.fileName)}
                      title="Download file"
                    >
                      ⬇️
                    </button>
                    <button
                      className="preparer-remove-button"
                      onClick={() => removeFile(file.id, file.fileName)}
                      title="Remove file"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filesToDelete.length > 0 && (
          <div className="preparer-deleted-files">
            <p className="preparer-files-subtitle deleted">
              Files to be removed ({filesToDelete.length}):
            </p>
            <div className="preparer-deleted-files-list">
              {filesToDelete.map((file, index) => (
                <div key={index} className="preparer-deleted-file-item">
                  <span className="preparer-deleted-file-name">
                    {file.name}
                  </span>
                  <button
                    className="preparer-undo-button"
                    onClick={() =>
                      setFilesToDelete((prev) =>
                        prev.filter((f) => f.id !== file.id)
                      )
                    }
                    title="Undo removal"
                  >
                    ↩️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="preparer-add-files-section">
          <p className="preparer-files-subtitle">Add New Files:</p>
          <div className="preparer-file-upload-area">
            <input
              type="file"
              multiple
              onChange={handleNewFileSelect}
              className="preparer-file-input"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
            />
            <small className="preparer-file-hint">
              Supported formats: PDF, Word, Excel, Images (Max 10MB per file)
            </small>
          </div>

          {newFiles.length > 0 && (
            <div className="preparer-new-files">
              <p className="preparer-files-subtitle">
                New files to upload ({newFiles.length}):
              </p>
              <div className="preparer-new-files-list">
                {newFiles.map((file, index) => (
                  <div key={index} className="preparer-new-file-item">
                    <span className="preparer-new-file-name">{file.name}</span>
                    <button
                      className="preparer-remove-new-button"
                      onClick={() => removeNewFile(index)}
                      title="Remove file"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(filesToDelete.length > 0 || newFiles.length > 0) && (
          <div className="preparer-file-summary">
            <p className="preparer-summary-text">
              📊 File changes:
              {filesToDelete.length > 0 &&
                ` ${filesToDelete.length} file(s) to remove`}
              {filesToDelete.length > 0 && newFiles.length > 0 && ", "}
              {newFiles.length > 0 && ` ${newFiles.length} file(s) to upload`}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Merged Hierarchy of approval and verifier
  const getHieracrchy = (entry) => {
    const verifierHistory =
      entry.verificationHistory?.map((v) => ({
        type: "Verifier",
        status: v.status,
        remarks: v.remarks,
        date: new Date(v.verifiedDate),
        by: v.verifiedBy,
      })) || [];

    const approverHistory =
      entry.approvalHistory?.map((a) => ({
        type: "Approver",
        status: a.status,
        remarks: a.remarks,
        date: new Date(a.approvedDate),
        by: a.approvedBy,
      })) || [];

    const merged = [...verifierHistory, ...approverHistory];
    merged.sort((a, b) => a.date - b.date);

    return merged;
  };

  // Toggle card expansion
  const toggleCard = (entryId) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const isCardExpanded = (entryId) => {
    return expandedCards.has(entryId);
  };

  const renderEntryCard = (entry) => {
    const isExpanded = isCardExpanded(entry.id);
    const isEditing = editingEntry === entry.id;

    return (
      <div key={entry.id} className="preparer-entry-card">
        <div
          className="preparer-entry-header preparer-card-header-clickable"
          onClick={() => !isEditing && toggleCard(entry.id)}
          style={{ cursor: isEditing ? "default" : "pointer" }}
        >
          <div className="preparer-header-left">
            <h3 className="preparer-entry-title">
              Request Transfer #{entry.id} - {entry.vendorName}
            </h3>
            {!isExpanded && (
              <div className="preparer-collapsed-payment-due">
                <span className="preparer-payment-due-label">Payment Due:</span>
                <span className="preparer-payment-due-value">
                  {entry.paymentDue || "N/A"}
                </span>
              </div>
            )}
          </div>
          <div className="preparer-header-right">
            <span
              className={`preparer-status-badge ${getStatusClass(
                entry.currentStatus
              )}`}
            >
              {entry.currentStatus}
            </span>
            {!isEditing && (
              <span className="preparer-toggle-icon">
                {isExpanded ? "▼" : "▶"}
              </span>
            )}
          </div>
        </div>

        {isExpanded && (
          <>
            {isEditing ? (
              <EditFileAttachments
                attachments={entry.attachments}
                entryId={entry.id}
              />
            ) : (
              <FileAttachments attachments={entry.attachments} />
            )}

            {isEditing ? (
              <div className="preparer-edit-form">
                <h4 className="preparer-edit-title">
                  ✏️ Edit Entry #{entry.id}
                </h4>

                {entry.currentStatus === "Returned" &&
                  entry.latestVerifierRemarks && (
                    <div className="preparer-feedback-section">
                      <p className="preparer-feedback-title">
                        📝 Verifier's Feedback:
                      </p>
                      <p className="preparer-feedback-text">
                        {entry.latestVerifierRemarks}
                      </p>
                    </div>
                  )}

                {(entry.currentStatus === "Rejected-by-Approver" ||
                  entry.currentStatus === "Rejected-By-Approver") &&
                  entry.latestApproverRemarks && (
                    <div className="preparer-feedback-section approver">
                      <p className="preparer-feedback-title">
                        📝 Approver's Feedback:
                      </p>
                      <p className="preparer-feedback-text">
                        {entry.latestApproverRemarks}
                      </p>
                    </div>
                  )}

                {entry.currentStatus === "Verified Successfully" && (
                  <div className="preparer-feedback-section verified">
                    <p className="preparer-feedback-title">
                      ✅ Verified Successfully - Ready for Approval
                    </p>
                  </div>
                )}

                <div className="preparer-form-grid">
                  <div className="preparer-form-group">
                    <label className="preparer-form-label">
                      Balance As Per Adma Shamran:
                    </label>
                    <input
                      type="number"
                      name="balanceAsPerAdmaShamran"
                      value={editFormData.balanceAsPerAdmaShamran}
                      onChange={handleEditChange}
                      className="preparer-form-input"
                      step="0.01"
                    />
                  </div>

                  <div className="preparer-form-group">
                    <label className="preparer-form-label">
                      Balance As Per Supplier:
                    </label>
                    <input
                      type="number"
                      name="balanceAsPerSupplier"
                      value={editFormData.balanceAsPerSupplier}
                      onChange={handleEditChange}
                      className="preparer-form-input"
                      step="0.01"
                    />
                  </div>

                  <div className="preparer-form-group">
                    <label className="preparer-form-label">Difference:</label>
                    <input
                      type="text"
                      value={calculateEditDifference}
                      readOnly
                      className="preparer-form-input preparer-difference-display"
                    />
                  </div>

                  <div className="preparer-form-group">
                    <label className="preparer-form-label">
                      Reason of Difference:
                    </label>
                    <textarea
                      name="reasonOFDifference"
                      value={editFormData.reasonOFDifference}
                      onChange={handleEditChange}
                      className="preparer-form-input preparer-form-textarea"
                    />
                  </div>

                  <div className="preparer-form-group">
                    <label className="preparer-form-label">Payment Due:</label>
                    <input
                      type="text"
                      name="paymentDue"
                      value={editFormData.paymentDue}
                      onChange={handleEditChange}
                      className="preparer-form-input"
                    />
                  </div>

                  <div className="preparer-form-group">
                    <label className="preparer-form-label">Remarks:</label>
                    <textarea
                      name="remarks"
                      value={editFormData.remarks}
                      onChange={handleEditChange}
                      className="preparer-form-input preparer-form-textarea"
                    />
                  </div>
                </div>

                <div className="preparer-form-actions">
                  <button
                    className="preparer-save-button"
                    onClick={() => handleUpdateEntry(entry.id, editFormData)}
                    disabled={isUploading}
                  >
                    {isUploading ? "⏳ Processing..." : "✅ Save & Update"}
                  </button>
                  <button
                    className="preparer-cancel-button"
                    onClick={cancelEditing}
                    disabled={isUploading}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="preparer-entry-details">
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">Adma Balance</span>
                    <span className="preparer-detail-value">
                      SAR: {entry.balanceAsPerAdmaShamran}
                    </span>
                  </div>
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">
                      Supplier Balance
                    </span>
                    <span className="preparer-detail-value">
                      SAR: {entry.balanceAsPerSupplier}
                    </span>
                  </div>
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">Difference</span>
                    <span className="preparer-detail-value">
                      SAR: {entry.difference}
                    </span>
                  </div>
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">Reason</span>
                    <span className="preparer-detail-value">
                      {entry.reasonOFDifference}
                    </span>
                  </div>
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">Payment Due</span>
                    <span className="preparer-detail-value">
                      {entry.paymentDue}
                    </span>
                  </div>
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">Remarks</span>
                    <span className="preparer-detail-value">
                      {entry.remarks}
                    </span>
                  </div>
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">Branch</span>
                    <span className="preparer-detail-value">
                      {entry.vendorBranch}
                    </span>
                  </div>
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">Date</span>
                    <span className="preparer-detail-value">
                      {new Date(
                        entry.preparedByCreatedDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="preparer-detail-item">
                    <span className="preparer-detail-label">Priority Type</span>
                    <span className="preparer-detail-value">
                      {entry.priorityName}
                    </span>
                  </div>
                </div>

                {entry.currentStatus === "Returned" &&
                  entry.latestVerifierRemarks && (
                    <div className="preparer-feedback-section">
                      <p className="preparer-feedback-title">
                        📝 Verifier's Feedback:
                      </p>
                      <p className="preparer-feedback-text">
                        {entry.latestVerifierRemarks}
                      </p>
                    </div>
                  )}

                {(entry.currentStatus === "Rejected-by-Approver" ||
                  entry.currentStatus === "Rejected-By-Approver") &&
                  entry.latestApproverRemarks && (
                    <div className="preparer-feedback-section approver">
                      <p className="preparer-feedback-title">
                        📝 Approver's Feedback:
                      </p>
                      <p className="preparer-feedback-text">
                        {entry.latestApproverRemarks}
                      </p>
                    </div>
                  )}

                {entry.currentStatus === "Verified Successfully" && (
                  <div className="preparer-feedback-section verified">
                    <p className="preparer-feedback-title">
                      ✅ Verified Successfully - Ready for Approval
                    </p>
                  </div>
                )}

                <div className="preparer-history-section approval">
                  <p className="preparer-history-title">History</p>
                  {getHieracrchy(entry).map((item, index) => (
                    <div key={index} className="preparer-history-item">
                      <div className="preparer-history-status">
                        {item.type} - {item.status}
                      </div>
                      <div className="preparer-history-meta">
                        by {item.by} • {item.date.toLocaleString()}
                      </div>
                      {item.remarks && (
                        <div className="preparer-history-remarks">
                          <strong>Remarks:</strong> {item.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {canEditEntry(entry) && (
                  <div className="preparer-entry-actions">
                    <button
                      className="preparer-edit-button"
                      onClick={() => startEditing(entry)}
                    >
                      ✏️ Edit Entry
                    </button>
                    {entry.currentStatus === "Returned" && (
                      <button
                        className="preparer-resubmit-button"
                        onClick={() => quickResubmit(entry.id)}
                      >
                        📤 Resubmit As Is
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  };

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
              <h2>Prepared By</h2>
              <p>{user?.username || "User"}</p>
            </div>
            <nav className="preparer-sidebar-nav">
              <button
                className="preparer-sidebar-button"
                onClick={() => {
                  navigate("/form-prepare");
                  closeSidebarOnSmall();
                }}
              >
                ➕ Create Request for transfer
              </button>
              <button
                className="preparer-sidebar-button"
                onClick={() => {
                  navigate("/customer-list");
                  closeSidebarOnSmall();
                }}
              >
                👥 Customers
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
                    htmlFor="profile-new-password"
                  >
                    New Password
                  </label>
                  <input
                    id="profile-new-password"
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
                Welcome, <strong>{user?.username || "User"}</strong>
              </p>
            </div>
          </div>

          {/* SIMPLIFIED FILTERS SECTION - ONLY DATE FILTER */}
          <div className="preparer-filters-section">
            <h3>Filter by date</h3>
            <div className="preparer-filters-grid">
              {/* Date From Filter */}
              <div className="preparer-filter-group">
                <label className="preparer-filter-label">From Date:</label>
                <input
                  type="date"
                  name="fromDate"
                  value={dateFilter.fromDate}
                  onChange={handleDateFilterChange}
                  className="preparer-filter-input"
                />
              </div>

              {/* Date To Filter */}
              <div className="preparer-filter-group">
                <label className="preparer-filter-label">To Date:</label>
                <input
                  type="date"
                  name="toDate"
                  value={dateFilter.toDate}
                  onChange={handleDateFilterChange}
                  className="preparer-filter-input"
                />
              </div>

              {/* Filter Actions */}
              <div className="preparer-filter-actions">
                <button
                  className="preparer-action-button preparer-apply-button"
                  onClick={applyFilters}
                >
                  🔍 Apply Filter
                </button>
                <button
                  className="preparer-action-button preparer-clear-button"
                  onClick={clearFilters}
                >
                  🗑️ Clear Filter
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="preparer-tabs-container">
            <div className="preparer-tabs">
              {[
                { key: "all", label: "All Entries", count: counts.all },
                {
                  key: "submitted",
                  label: "Submitted",
                  count: counts.submitted,
                },
                {
                  key: "resubmitted",
                  label: "Re-Submitted",
                  count: counts.resubmitted,
                },
                { key: "returned", label: "Returned", count: counts.returned },
                { key: "verified", label: "Verified", count: counts.verified },
                { key: "approved", label: "Approved", count: counts.approved },
                {
                  key: "rejected",
                  label: "Rejected",
                  count: counts.rejected,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`preparer-tab ${
                    activeTab === tab.key ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span className="preparer-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="preparer-entries-container">
            {filteredEntries.length === 0 ? (
              <div className="preparer-empty-state">
                <div className="preparer-empty-icon">📋</div>
                <p className="preparer-empty-text">
                  No {activeTab === "all" ? "" : activeTab} entries found
                  {dateFilter.fromDate || dateFilter.toDate
                    ? " with current date filter"
                    : ""}
                </p>
                {(dateFilter.fromDate || dateFilter.toDate) && (
                  <button
                    className="preparer-action-button preparer-clear-button"
                    onClick={clearFilters}
                    style={{ marginTop: "10px" }}
                  >
                    🗑️ Clear Date Filter
                  </button>
                )}
              </div>
            ) : (
              filteredEntries.map((entry) => renderEntryCard(entry))
            )}
          </div>

          <ToastContainer position="bottom-right" />
        </div>
      </div>
    </div>
  );
}
