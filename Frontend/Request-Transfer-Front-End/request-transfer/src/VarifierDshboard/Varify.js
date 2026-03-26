import React, { useState, useEffect } from "react";
import API from "../api";
import { toast, ToastContainer } from "react-toastify";
import "./VerifierDashboard.css";
import { useNavigate } from "react-router-dom";

// Modal Component
const ReturnModal = ({ isOpen, onClose, onSubmit, title, placeholder }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason);
      setReason("");
      onClose();
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-scrollable-content">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
              rows="4"
              required
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="modal-cancel-btn"
            >
              Cancel
            </button>
            <button type="submit" className="modal-submit-btn">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Verify Modal Component
const VerifyModal = ({ isOpen, onClose, onSubmit }) => {
  const [remarks, setRemarks] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(remarks || "Verified successfully");
    setRemarks("");
    onClose();
  };

  const handleClose = () => {
    setRemarks("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Verify Entry</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-scrollable-content">
            <div className="modal-field">
              <label htmlFor="verify-remarks">Remarks (Optional):</label>
              <textarea
                id="verify-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter verification remarks (default: 'Verified successfully')"
                rows="4"
                autoFocus
              />
            </div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="modal-cancel-btn"
            >
              Cancel
            </button>
            <button type="submit" className="modal-submit-btn">
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Varify({ user }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [dashboardData, setDashboardData] = useState({
    pending: [],
    returned: [],
    verified: [],
    rejected: [],
    returnedByApprover: [],
    approved: [],
  });
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    entryId: null,
  });
  const [verifyModalState, setVerifyModalState] = useState({
    isOpen: false,
    entryId: null,
  });
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ newPassword: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Initialize date filter with current month (default)
  const getCurrentMonthDates = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      fromDate: startDate.toISOString().split("T")[0],
      toDate: endDate.toISOString().split("T")[0],
    };
  };

  // Date filter state - initialized with current month
  const [dateFilter, setDateFilter] = useState(getCurrentMonthDates());

  // Branch filter state
  const [selectedBranch, setSelectedBranch] = useState("all");

  // Branch filters configuration
  const branchFilters = {
    riyadh: ["Riyadh"],
    dammam: ["Dammam"],
    madinah: ["Madinah"],
    jeddah: ["Jeddah"],
    tabuk: ["Tabuk"],
    qasim: ["Qasim"],
    hail: ["Hail"],
    //other will add
    all: [],
  };

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sort entries by date (newest first)
  const sortEntriesByDate = (entries) => {
    return entries.sort((a, b) => {
      const dateA = new Date(a.preparedByCreatedDate);
      const dateB = new Date(b.preparedByCreatedDate);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  // Fetch dashboard data with date filters
  const fetchDashboardData = async (fromDate = null, toDate = null) => {
    try {
      setLoading(true);

      if (!user || !user.id) {
        toast.error("User not found.");
        setLoading(false);
        return;
      }

      const userId = user.id;

      // Use provided dates or current filter dates
      const fromDateParam = fromDate || dateFilter.fromDate;
      const toDateParam = toDate || dateFilter.toDate;

      // Build query parameters
      const buildQueryParams = () => {
        const params = new URLSearchParams();
        if (fromDateParam) {
          params.append("fromDate", fromDateParam);
        }
        if (toDateParam) {
          params.append("toDate", toDateParam);
        }
        return params.toString() ? `?${params.toString()}` : "";
      };

      const queryString = buildQueryParams();

      const [
        pendingRes,
        returnedRes,
        verifiedRes,
        rejectedRes,
        returnedByApproverRes,
        approvedRes,
      ] = await Promise.all([
        API.get(`/Verifier/pending/${userId}${queryString}`),
        API.get(`/Verifier/returned/${userId}${queryString}`),
        API.get(`/Verifier/verified/${userId}${queryString}`),
        API.get(`/Verifier/rejected/${userId}${queryString}`),
        API.get(`/Verifier/returned-by-approver/${userId}${queryString}`),
        API.get(`/Verifier/approved/${userId}${queryString}`),
      ]);

      const allData = {
        pending: sortEntriesByDate(pendingRes.data || []),
        returned: sortEntriesByDate(returnedRes.data || []),
        verified: sortEntriesByDate(verifiedRes.data || []),
        rejected: sortEntriesByDate(rejectedRes.data || []),
        returnedByApprover: sortEntriesByDate(returnedByApproverRes.data || []),
        approved: sortEntriesByDate(approvedRes.data || []),
      };

      setAllEntries(allData);

      // Apply branch filter if needed
      if (selectedBranch !== "all") {
        let filteredData = {};
        Object.keys(allData).forEach((tab) => {
          let filtered = [...allData[tab]];
          const branchNames = branchFilters[selectedBranch];
          filtered = filtered.filter((entry) =>
            branchNames.includes(entry.preparedByBranch)
          );
          filteredData[tab] = sortEntriesByDate(filtered);
        });
        setDashboardData(filteredData);
      } else {
        setDashboardData(allData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters (date + branch)
  // Date filters are applied via API, branch filter is applied client-side
  const applyFilters = () => {
    // Refetch data with new date filters from API
    fetchDashboardData(dateFilter.fromDate, dateFilter.toDate);
    toast.success(`Filters applied!`);
  };

  // Clear all filters - reset to current month
  const clearFilters = () => {
    const currentMonth = getCurrentMonthDates();
    setDateFilter(currentMonth);
    setSelectedBranch("all");
    // Refetch data with current month dates
    fetchDashboardData(currentMonth.fromDate, currentMonth.toDate);
    toast.info("All filters cleared - showing current month");
  };

  // Handle date filter changes
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle branch filter change - apply immediately
  const handleBranchChange = (e) => {
    const newBranch = e.target.value;
    setSelectedBranch(newBranch);

    // Apply branch filter to current data
    if (newBranch === "all") {
      setDashboardData(allEntries);
    } else {
      let filteredData = {};
      const branchNames = branchFilters[newBranch];
      Object.keys(allEntries).forEach((tab) => {
        let filtered = [...allEntries[tab]];
        filtered = filtered.filter((entry) =>
          branchNames.includes(entry.preparedByBranch)
        );
        filteredData[tab] = sortEntriesByDate(filtered);
      });
      setDashboardData(filteredData);
    }
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

  // Download file function
  const downloadPreparerFile = async (attachmentId, fileName) => {
    try {
      const response = await API.get(
        `/Verifier/download-attachment/${attachmentId}`,
        { responseType: "blob" }
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const openModal = (type, entryId) => {
    setModalState({ isOpen: true, type, entryId });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, entryId: null });
  };

  const openVerifyModal = (entryId) => {
    setVerifyModalState({ isOpen: true, entryId });
  };

  const closeVerifyModal = () => {
    setVerifyModalState({ isOpen: false, entryId: null });
  };

  const handleModalSubmit = async (reason) => {
    const { type, entryId } = modalState;

    try {
      const payload = {
        VerifiedByUserId: user.id,
        Remarks: reason,
      };

      if (type === "return") {
        await API.post(`/Verifier/return/${entryId}`, payload);
        toast.success("✅ Entry returned for correction!");
      } else if (type === "returnToPreparer") {
        await API.post(`/Verifier/return-to-preparer/${entryId}`, payload);
        toast.success("✅ Entry returned to preparer for correction!");
      }

      fetchDashboardData();
    } catch (error) {
      console.error(`Error returning entry:`, error);
      toast.error("❌ Failed to return entry.");
    }
  };

  const handleVerifySubmit = async (remarks) => {
    const { entryId } = verifyModalState;

    try {
      const payload = {
        VerifiedByUserId: user.id,
        Remarks: remarks || "Verified successfully",
      };

      await API.post(`/Verifier/verify/${entryId}`, payload);
      toast.success("✅ Entry verified successfully! Sent to approver.");
      fetchDashboardData();
    } catch (error) {
      console.error("Error verifying entry:", error);
      toast.error("❌ Failed to verify entry.");
    }
  };

  const handleReturn = (entryId) => openModal("return", entryId);
  const handleReturnToPreparer = (entryId) =>
    openModal("returnToPreparer", entryId);
  const handleVerify = (entryId) => openVerifyModal(entryId);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("Auth");
  };

  const handleReport = () => {
    navigate("/report1");
  };

  const closeSidebarOnSmall = () => {
    if (window.innerWidth < 992) {
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

  // HISTORY LOGIC - Same as PreparerDashboard
  const getHierarchy = (entry) => {
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
    merged.sort((a, b) => b.date - a.date); // Sort by date descending (newest first)

    return merged;
  };

  const getTabCounts = () => ({
    pending: dashboardData.pending?.length || 0,
    returned: dashboardData.returned?.length || 0,
    verified: dashboardData.verified?.length || 0,
    rejected: dashboardData.rejected?.length || 0,
    returnedByApprover: dashboardData.returnedByApprover?.length || 0,
    approved: dashboardData.approved?.length || 0,
  });

  const getStatusClass = (status) => {
    const statusMap = {
      Submitted: "verifier-status-submitted",
      "Re-Submitted": "verifier-status-resubmitted",
      Returned: "verifier-status-returned",
      Verified: "verifier-status-verified",
      "Returned-To-Verifier": "verifier-status-returned-to-verifier",
      Approved: "verifier-status-approved",
      Rejected: "verifier-status-rejected",
    };
    return statusMap[status] || "verifier-status-submitted";
  };

  // Completion tracking functions (from PaymentCompletionDashboard)
  const getCompletionPercentage = (entry) => {
    if (!entry.paymentCompletion) return 0;

    const { paymentDone, odooEntryDone, attachmentsDone } =
      entry.paymentCompletion;
    const completedCount = [paymentDone, odooEntryDone, attachmentsDone].filter(
      Boolean
    ).length;
    return Math.round((completedCount / 3) * 100);
  };

  const getStatusColor = (percentage) => {
    if (percentage === 100) return "#28a745";
    if (percentage >= 67) return "#17a2b8";
    if (percentage >= 34) return "#ffc107";
    return "#dc3545";
  };

  const FileAttachments = ({ attachments }) => {
    if (!attachments || attachments.length === 0) {
      return (
        <div className="verifier-no-attachments">
          <p>📎 No files attached</p>
        </div>
      );
    }

    return (
      <div className="verifier-attachments-section">
        <p className="verifier-attachments-title">
          📁 Attached Files ({attachments.length})
        </p>
        <div className="verifier-attachments-list">
          {attachments.map((file) => (
            <div key={file.id} className="verifier-attachment-item">
              <div className="verifier-attachment-info">
                <span className="verifier-attachment-name">
                  {file.fileName}
                </span>
                <span className="verifier-attachment-size">
                  {formatFileSize(file.fileSize)}
                </span>
                <span className="verifier-attachment-date">
                  {new Date(file.uploadDate).toLocaleDateString()}
                </span>
                <span className="verifier-attachment-uploader">
                  Uploaded by: {file.uploadedBy}
                </span>
              </div>
              <button
                className="verifier-download-button"
                onClick={() => downloadPreparerFile(file.id, file.fileName)}
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

  const renderEntryCard = (entry, showActions = true, tabType = "pending") => {
    const isExpanded = isCardExpanded(entry.id);

    // Debug: Log entry data to check if paymentCompletion exists
    if (tabType === "approved" && entry.id) {
      console.log(
        `Entry ${entry.id} paymentCompletion:`,
        entry.paymentCompletion
      );
    }

    return (
      <div key={entry.id} className="verifier-entry-card">
        <div
          className="verifier-entry-header verifier-card-header-clickable"
          onClick={() => toggleCard(entry.id)}
        >
          <div className="verifier-header-left">
            <h3 className="verifier-entry-title">
              Request Transfer #{entry.id} - {entry.vendorName}
            </h3>
            {!isExpanded && (
              <div className="verifier-collapsed-payment-due">
                <span className="verifier-payment-due-label">Payment Due:</span>
                <span className="verifier-payment-due-value">
                  {entry.paymentDue || "N/A"}
                </span>
              </div>
            )}
            {!isExpanded && entry.paymentCompletion && (
              <div className="verifier-collapsed-completion">
                <span
                  className="verifier-completion-badge-small"
                  style={{
                    background: getStatusColor(getCompletionPercentage(entry)),
                  }}
                >
                  {getCompletionPercentage(entry)}% Complete
                </span>
              </div>
            )}
          </div>
          <div className="verifier-header-right">
            {entry.paymentCompletion && (
              <div
                className="verifier-completion-badge"
                style={{
                  background: getStatusColor(getCompletionPercentage(entry)),
                }}
              >
                {getCompletionPercentage(entry)}% Complete
              </div>
            )}
            <span
              className={`verifier-status-badge ${getStatusClass(
                entry.currentStatus
              )}`}
            >
              {entry.currentStatus}
            </span>
            <span className="verifier-toggle-icon">
              {isExpanded ? "▼" : "▶"}
            </span>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Date Badge - Show prepared date prominently */}
            <div className="verifier-date-badge">
              📅 Prepared:{" "}
              {new Date(entry.preparedByCreatedDate).toLocaleDateString()} at{" "}
              {new Date(entry.preparedByCreatedDate).toLocaleTimeString()}
            </div>

            <FileAttachments attachments={entry.attachments} />

            {/* Entry details */}
            <div className="verifier-entry-details">
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Prepared by</span>
                <span className="verifier-detail-value">
                  {entry.preparedBy}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">
                  Prepared by branch
                </span>
                <span className="verifier-detail-value">
                  {entry.preparedByBranch}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Vendor</span>
                <span className="verifier-detail-value">
                  {entry.vendorName}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Bank</span>
                <span className="verifier-detail-value">
                  {entry.vendorBank} - {entry.vendorBankAcc}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Branch</span>
                <span className="verifier-detail-value">
                  {entry.vendorBranch}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Adma Balance</span>
                <span className="verifier-detail-value">
                  SAR: {entry.balanceAsPerAdmaShamran}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Supplier Balance</span>
                <span className="verifier-detail-value">
                  SAR: {entry.balanceAsPerSupplier}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Difference</span>
                <span className="verifier-detail-value">
                  SAR: {entry.difference}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">
                  Reason for Difference
                </span>
                <span className="verifier-detail-value">
                  {entry.reasonOFDifference}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Payment Due</span>
                <span className="verifier-detail-value">
                  {entry.paymentDue}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Remarks</span>
                <span className="verifier-detail-value">{entry.remarks}</span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Prepared Date</span>
                <span className="verifier-detail-value">
                  {new Date(entry.preparedByCreatedDate).toLocaleString()}
                </span>
              </div>
              <div className="verifier-detail-item">
                <span className="verifier-detail-label">Priority Type</span>
                <span className="verifier-detail-value">
                  {entry.priorityName}
                </span>
              </div>
            </div>

            {/* Completion Status Section - Show if paymentCompletion exists */}
            {entry.paymentCompletion && (
              <div className="verifier-completion-section">
                <h4 className="verifier-section-title">Completion Status</h4>

                <div className="verifier-completion-steps-grid">
                  {[
                    {
                      key: "paymentDone",
                      label: "Payment Processed",
                      date: entry.paymentCompletion?.paymentDoneDate,
                      isDone: entry.paymentCompletion?.paymentDone || false,
                    },
                    {
                      key: "odooEntryDone",
                      label: "Odoo Entry",
                      date: entry.paymentCompletion?.odooEntryDoneDate,
                      isDone: entry.paymentCompletion?.odooEntryDone || false,
                    },
                    {
                      key: "attachmentsDone",
                      label: "Attachments",
                      date: entry.paymentCompletion?.attachmentsDoneDate,
                      isDone: entry.paymentCompletion?.attachmentsDone || false,
                    },
                  ].map((item) => (
                    <div key={item.key} className="verifier-completion-step">
                      <div
                        className={`verifier-completion-step-icon ${
                          item.isDone ? "completed" : "pending"
                        }`}
                      >
                        {item.isDone ? "✓" : "..."}
                      </div>
                      <div className="verifier-completion-step-label">
                        {item.label}
                      </div>
                      {item.isDone && item.date && (
                        <div className="verifier-completion-step-date">
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      )}
                      {!item.isDone && (
                        <div className="verifier-completion-step-pending">
                          Pending
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="verifier-progress-bar-container">
                  <div
                    className="verifier-progress-bar"
                    style={{
                      width: `${getCompletionPercentage(entry)}%`,
                      background: getStatusColor(
                        getCompletionPercentage(entry)
                      ),
                    }}
                  />
                </div>

                <div className="verifier-completion-meta">
                  <span>
                    Last updated:{" "}
                    {entry.paymentCompletion
                      ? new Date(
                          entry.paymentCompletion.lastUpdatedDate
                        ).toLocaleString()
                      : "Never"}
                  </span>
                  <span>By: {entry.paymentCompletion?.updatedBy || "N/A"}</span>
                </div>

                {entry.paymentCompletion?.Remarks && (
                  <div className="verifier-completion-remarks">
                    <strong>Remarks:</strong> {entry.paymentCompletion.Remarks}
                  </div>
                )}
              </div>
            )}

            {/* HISTORY SECTION - Only show when status is NOT pending */}
            {entry.currentStatus !== "Submitted" &&
              entry.currentStatus !== "Re-Submitted" && (
                <div className="verifier-history-section">
                  <p className="verifier-history-title">📋 History</p>
                  {getHierarchy(entry).length > 0 ? (
                    getHierarchy(entry).map((item, index) => (
                      <div key={index} className="verifier-history-item">
                        <div className="verifier-history-status">
                          <span
                            className={`verifier-history-type ${item.type.toLowerCase()}`}
                          >
                            {item.type}
                          </span>
                          <span className="verifier-history-action">
                            {item.status}
                          </span>
                        </div>
                        <div className="verifier-history-meta">
                          by {item.by} • {item.date.toLocaleString()}
                        </div>
                        {item.remarks && (
                          <div className="verifier-history-remarks">
                            <strong>Remarks:</strong> {item.remarks}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="verifier-no-history">
                      No history available
                    </div>
                  )}
                </div>
              )}

            {/* Action buttons */}
            {showActions && tabType === "pending" && (
              <div className="verifier-action-buttons">
                <button
                  className="verifier-verify-button"
                  onClick={() => handleVerify(entry.id)}
                >
                  ✅ Verify
                </button>

                <button
                  className="verifier-return-button"
                  onClick={() => handleReturn(entry.id)}
                >
                  ↩️ Return for Correction
                </button>
              </div>
            )}

            {showActions && tabType === "returnedByApprover" && (
              <div className="verifier-action-buttons">
                <button
                  className="verifier-return-to-preparer-button"
                  onClick={() => handleReturnToPreparer(entry.id)}
                >
                  ↩️ Return to Preparer
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading)
    return <div className="verifier-loading">Loading entries...</div>;

  const counts = getTabCounts();

  return (
    <div className="verifier-dashboard-container">
      {!isSidebarOpen && (
        <button
          className="verifier-menu-toggle"
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
          className="verifier-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="verifier-dashboard-shell">
        <aside
          className={`verifier-sidebar ${isSidebarOpen ? "open" : "collapsed"}`}
        >
          <button
            className="verifier-sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
          <div>
            <div className="verifier-sidebar-header">
              <h2>Verifier</h2>
              <p>{user?.username || "User"}</p>
            </div>
            <nav className="verifier-sidebar-nav">
              <button
                className="verifier-sidebar-button"
                onClick={() => {
                  handleReport();
                  closeSidebarOnSmall();
                }}
              >
                📊 Expected Cash Flow
              </button>
              <button
                className={`verifier-sidebar-button ${
                  isProfileOpen ? "active" : ""
                }`}
                onClick={() => setIsProfileOpen((prev) => !prev)}
              >
                👤 Profile
              </button>
            </nav>
            {isProfileOpen && (
              <div className="verifier-profile-card">
                <div className="verifier-profile-grid">
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
                    <div key={item.label} className="verifier-profile-item">
                      <span className="verifier-profile-label">
                        {item.label}
                      </span>
                      <span className="verifier-profile-value">
                        {item.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
                <form
                  className="verifier-profile-form"
                  onSubmit={handleProfileSubmit}
                >
                  <label
                    className="verifier-profile-form-label"
                    htmlFor="verifier-profile-new-password"
                  >
                    New Password
                  </label>
                  <input
                    id="verifier-profile-new-password"
                    type="password"
                    className="verifier-profile-input"
                    placeholder="Enter a new password"
                    value={profileForm.newPassword}
                    onChange={handleProfilePasswordChange}
                  />
                  <button
                    type="submit"
                    className="verifier-profile-submit"
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}
          </div>
          <button className="verifier-sidebar-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </aside>

        <div className="verifier-dashboard-main">
          <div className="verifier-dashboard-header">
            <div className="verifier-header-title">
              <h1>Dashboard</h1>
              <p>
                Welcome, <strong>{user?.username || "User"}</strong>
              </p>
            </div>
          </div>

          {/* FILTERS SECTION */}
          <div className="verifier-filters-section">
            <h3>Filters</h3>
            <div className="verifier-filters-grid">
              {/* Branch Filter */}
              <div className="verifier-filter-group">
                <label className="verifier-filter-label">Branch:</label>
                <select
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  className="verifier-filter-input"
                >
                  <option value="all">All Branches</option>
                  <option value="riyadh">Riyadh</option>
                  <option value="dammam">Dammam</option>
                  <option value="madinah">Madinah</option>
                  <option value="jeddah">Jeddah</option>
                  <option value="tabuk">Tabuk</option>
                  <option value="qasim">Qasim</option>
                  <option value="hail">Hail</option>
                </select>
              </div>

              {/* Date From Filter */}
              <div className="verifier-filter-group">
                <label className="verifier-filter-label">From Date:</label>
                <input
                  type="date"
                  name="fromDate"
                  value={dateFilter.fromDate}
                  onChange={handleDateFilterChange}
                  className="verifier-filter-input"
                />
              </div>

              {/* Date To Filter */}
              <div className="verifier-filter-group">
                <label className="verifier-filter-label">To Date:</label>
                <input
                  type="date"
                  name="toDate"
                  value={dateFilter.toDate}
                  onChange={handleDateFilterChange}
                  className="verifier-filter-input"
                />
              </div>

              {/* Filter Actions */}
              <div className="verifier-filter-actions">
                <button
                  className="verifier-action-button verifier-apply-button"
                  onClick={applyFilters}
                >
                  🔍 Apply Filters
                </button>
                <button
                  className="verifier-action-button verifier-clear-button"
                  onClick={clearFilters}
                >
                  🗑️ Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="verifier-tabs-container">
            <div className="verifier-tabs">
              {[
                { key: "pending", label: "Pending", count: counts.pending },
                { key: "returned", label: "Returned", count: counts.returned },
                { key: "verified", label: "Verified", count: counts.verified },
                {
                  key: "returnedByApprover",
                  label: "Returned by Approver",
                  count: counts.returnedByApprover,
                },
                { key: "approved", label: "Approved", count: counts.approved },
                { key: "rejected", label: "Rejected", count: counts.rejected },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`verifier-tab ${
                    activeTab === tab.key ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="verifier-tab-content">
              {dashboardData[activeTab] &&
                dashboardData[activeTab].length > 0 &&
                dashboardData[activeTab].map((entry) =>
                  renderEntryCard(
                    entry,
                    activeTab === "pending" ||
                      activeTab === "returnedByApprover",
                    activeTab
                  )
                )}

              {(!dashboardData[activeTab] ||
                dashboardData[activeTab].length === 0) && (
                <div className="verifier-no-data">
                  No {activeTab} entries found
                  {(dateFilter.fromDate ||
                    dateFilter.toDate ||
                    selectedBranch !== "all") && (
                    <div>
                      {/* <button
                      className="verifier-action-button verifier-clear-button"
                      onClick={clearFilters}
                      style={{ marginTop: "10px" }}
                    >
                      🗑️ Clear All Filters
                    </button> */}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      <ReturnModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        title={
          modalState.type === "return"
            ? "Return Entry for Correction"
            : "Return Entry to Preparer"
        }
        placeholder="Enter reason for return"
      />

      {/* Verify Modal */}
      <VerifyModal
        isOpen={verifyModalState.isOpen}
        onClose={closeVerifyModal}
        onSubmit={handleVerifySubmit}
      />

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
