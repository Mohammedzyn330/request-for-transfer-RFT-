import React, { useState, useEffect } from "react";
import API from "../api";
import { toast, ToastContainer } from "react-toastify";
import "./ApproverDashboard.css";
import { useNavigate } from "react-router-dom";

const ReturnAndRejectModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder,
}) => {
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

// NEW: Approval Modal Component
const ApprovalModal = ({ isOpen, onClose, onSubmit, entry }) => {
  const [otherAmount, setOtherAmount] = useState("0");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      otherAmount: parseFloat(otherAmount) || 0,
      remarks: remarks || "Approved successfully",
    });
    setOtherAmount("0");
    setRemarks("");
    onClose();
  };

  const handleClose = () => {
    setOtherAmount("0");
    setRemarks("");
    onClose();
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content approval-modal">
        <h3>Approve Entry #{entry.id}</h3>

        {/* Payment Due Information */}
        <div className="approval-payment-info">
          <div className="payment-due-section">
            <h4>Payment Information</h4>
            <div className="payment-due-item">
              <span className="payment-label">
                Payment Due(By branch account):
              </span>
              <span className="payment-value">
                SAR {parseFloat(entry.paymentDue || 0).toLocaleString()}
              </span>
            </div>
            <div className="payment-due-item">
              <span className="payment-label">Difference Amount:</span>
              <span className="payment-value">
                SAR {parseFloat(entry.difference || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-scrollable-content">
            {/* Other Amount Input */}
            <div className="form-group">
              <label htmlFor="otherAmount" className="form-label">
                Amount change (If required):
              </label>
              <input
                type="number"
                id="otherAmount"
                value={otherAmount}
                onChange={(e) => setOtherAmount(e.target.value)}
                placeholder="Enter additional amount (0 if none)"
                step="0.01"
                min="0"
                className="form-input"
              />
              <small className="form-help">
                Enter 0 if no additional amount is required
              </small>
            </div>

            {/* Remarks Input */}
            <div className="form-group">
              <label htmlFor="remarks" className="form-label">
                Remarks (Optional):
              </label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any additional remarks..."
                rows="3"
                className="form-textarea"
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
            <button type="submit" className="modal-approve-btn">
              ✅ Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ApproverDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [activeView, setActiveView] = useState("priority");
  const [dashboardData, setDashboardData] = useState({
    pending: [],
    approved: [],
    rejected: [],
    returnedToVerifier: [],
    paymentCompletion: [],
  });
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    entryId: null,
    entry: null, // NEW: Store the entry for approval modal
  });

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ newPassword: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Branch filters configuration
  const branchFilters = {
    riyadh: ["Riyadh"],
    dammam: ["Dammam"],
    madinah: ["Madinah"],
    jeddah: ["Jeddah"],
    tabuk: ["Tabuk"],
    qasim: ["Qasim"],
    hail: ["Hail"],
    abha: ["Abha"],
    all: [],
  };

  // Function to sort entries by date (newest first)
  const sortEntriesByDate = (entries) => {
    return entries.sort((a, b) => {
      const dateA = new Date(
        a.preparedByCreatedDate || a.preparedDate || a.createdDate
      );
      const dateB = new Date(
        b.preparedByCreatedDate || b.preparedDate || b.createdDate
      );
      return dateB - dateA;
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Helper function to fetch with error handling for each endpoint
      const fetchWithFallback = async (endpoint, defaultData = []) => {
        try {
          const response = await API.get(endpoint);
          return response.data || defaultData;
        } catch (error) {
          console.error(`Error fetching ${endpoint}:`, error);
          // Show specific error for timeout issues
          if (error.response?.status === 500) {
            const errorMsg = error.response?.data?.message || error.message;
            if (errorMsg.includes("Timeout") || errorMsg.includes("timeout")) {
              toast.warning(
                `Timeout loading ${endpoint
                  .split("/")
                  .pop()} data. Please try refreshing.`
              );
            } else {
              toast.warning(
                `Failed to load ${endpoint.split("/").pop()} data.`
              );
            }
          } else if (error.code === "ERR_BAD_RESPONSE") {
            toast.warning(
              `Server error loading ${endpoint
                .split("/")
                .pop()} data. Please try again.`
            );
          }
          return defaultData;
        }
      };

      // Fetch all endpoints in parallel, but handle each failure individually
      const [
        pendingData,
        approvedData,
        rejectedData,
        returnedData,
        paymentCompletionData,
      ] = await Promise.all([
        fetchWithFallback(`/Approver/pending/${user.id}`),
        fetchWithFallback(`/Approver/approved/${user.id}`),
        fetchWithFallback(`/Approver/rejected/${user.id}`),
        fetchWithFallback(`/Approver/returned-to-verifier/${user.id}`),
        fetchWithFallback(`/Approver/payment-completion-status/${user.id}`),
      ]);

      const allData = {
        pending: sortEntriesByDate(pendingData || []),
        approved: sortEntriesByDate(approvedData || []),
        rejected: sortEntriesByDate(rejectedData || []),
        returnedToVerifier: sortEntriesByDate(returnedData || []),
        paymentCompletion: sortEntriesByDate(paymentCompletionData || []),
      };

      setAllEntries(allData);
      setDashboardData(allData);

      // Show success message if at least some data was loaded
      const hasData = Object.values(allData).some((arr) => arr.length > 0);
      if (hasData) {
        // Silent success - data loaded
      } else {
        toast.error(
          "Unable to load dashboard data. Please check your connection and try again."
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error(
        "Failed to load dashboard data. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters
  const applyFilters = () => {
    setLoading(true);

    let filteredData = {};

    Object.keys(allEntries).forEach((tab) => {
      let filtered = [...allEntries[tab]];

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
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((entry) => {
          const entryDate = new Date(entry.preparedByCreatedDate);
          return entryDate <= toDate;
        });
      }

      // Apply branch filter
      if (selectedBranch !== "all") {
        const branchNames = branchFilters[selectedBranch];
        filtered = filtered.filter((entry) =>
          branchNames.includes(entry.preparedByBranch)
        );
      }

      filteredData[tab] = filtered;
    });

    setDashboardData(filteredData);
    setLoading(false);
    toast.success(`Filters applied!`);
  };

  // Clear all filters
  const clearFilters = () => {
    setDateFilter({
      fromDate: "",
      toDate: "",
    });
    setSelectedBranch("all");
    setDashboardData(allEntries);
    toast.info("All filters cleared");
  };

  // Handle date filter changes
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle branch filter change
  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
    navigate("Auth");
  };

  const handleReport = () => {
    navigate("/report");
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

  // Modal popup functions - UPDATED
  const openModal = (type, entryId, entry = null) => {
    setModalState({ isOpen: true, type, entryId, entry });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, entryId: null, entry: null });
  };

  const handleModalSubmit = async (reason) => {
    const { type, entryId } = modalState;

    try {
      const payload = {
        ApprovedByUserId: user.id,
        Remarks: reason,
        OtherAmount: 0, // Default 0 for reject/return actions
      };

      if (type === "reject") {
        await API.post(`/Approver/reject/${entryId}`, payload);
        toast.success("✅ Entry rejected successfully!");
      } else if (type === "returnToVerifier") {
        await API.post(`/Approver/return-to-verifier/${entryId}`, payload);
        toast.success("✅ Entry returned to verifier!");
      }

      fetchDashboardData();
    } catch (error) {
      console.error(`Error processing entry:`, error);
      toast.error("❌ Failed to process entry.");
    }
  };

  // NEW: Handle approval with otherAmount
  const handleApprovalSubmit = async (approvalData) => {
    const { entryId } = modalState;

    try {
      const payload = {
        ApprovedByUserId: user.id,
        Remarks: approvalData.remarks,
        OtherAmount: approvalData.otherAmount,
      };

      const response = await API.post(`/Approver/approve/${entryId}`, payload);

      if (response.data.isResubmission) {
        toast.success(
          `✅ Resubmitted entry approved! Additional amount: SAR ${approvalData.otherAmount.toLocaleString()}`
        );
      } else {
        toast.success(
          `✅ Entry approved successfully! Additional amount: SAR ${approvalData.otherAmount.toLocaleString()}`
        );
      }

      fetchDashboardData();
    } catch (error) {
      console.error("Error approving entry:", error);
      if (error.response?.data) {
        toast.error(`❌ ${error.response.data}`);
      } else {
        toast.error("❌ Failed to approve entry.");
      }
    }
  };

  // UPDATED: Handle approve button click
  const handleApprove = async (entry) => {
    openModal("approve", entry.id, entry);
  };

  // Keep existing reject and return functions
  const handleReject = async (entryId) => {
    openModal("reject", entryId);
  };

  const handleReturnToVerifier = async (entryId) => {
    openModal("returnToVerifier", entryId);
  };

  // Download payment completion attachment
  const downloadPaymentAttachment = async (attachmentId, fileName) => {
    try {
      const response = await API.get(
        `/Approver/download-payment-attachment/${attachmentId}`,
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
      console.error("Error downloading payment attachment:", error);
      toast.error("❌ Failed to download attachment.");
    }
  };

  // Download preparer's original attachment
  const downloadPreparerAttachment = async (attachmentId, fileName) => {
    try {
      const response = await API.get(
        `/Approver/download-preparer-attachment/${attachmentId}`,
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
      console.error("Error downloading preparer attachment:", error);
      toast.error("❌ Failed to download file.");
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTabCounts = () => ({
    pending: dashboardData.pending?.length || 0,
    approved: dashboardData.approved?.length || 0,
    rejected: dashboardData.rejected?.length || 0,
    returnedToVerifier: dashboardData.returnedToVerifier?.length || 0,
    paymentCompletion: dashboardData.paymentCompletion?.length || 0,
  });

  const getStatusClass = (status) => {
    const statusMap = {
      Verified: "approver-status-verified",
      Approved: "approver-status-approved",
      "Rejected-By-Approver": "approver-status-rejected",
      Returned: "approver-status-returned",
    };
    return statusMap[status] || "approver-status-verified";
  };

  const getProgressClass = (percentage) => {
    if (percentage === 100) return "approver-progress-complete";
    if (percentage > 50) return "approver-progress-high";
    return "approver-progress-medium";
  };

  // File attachments component for preparer's files
  const PreparerFileAttachments = ({ attachments }) => {
    if (!attachments || attachments.length === 0) {
      return (
        <div className="approver-no-attachments">
          <p>📎 No supporting files attached by preparer</p>
        </div>
      );
    }

    return (
      <div className="approver-preparer-attachments-section">
        <p className="approver-attachments-title">
          📁 Supporting Documents from Preparer ({attachments.length})
        </p>
        <div className="approver-attachments-list">
          {attachments.map((file) => (
            <div key={file.id} className="approver-attachment-item">
              <div className="approver-attachment-info">
                <span className="approver-attachment-name">
                  {file.fileName}
                </span>
                <span className="approver-attachment-size">
                  {formatFileSize(file.fileSize)}
                </span>
                <span className="approver-attachment-date">
                  {new Date(file.uploadDate).toLocaleDateString()}
                </span>
                <span className="approver-attachment-uploader">
                  Uploaded by: {file.uploadedBy}
                </span>
              </div>
              <button
                className="approver-download-button"
                onClick={() =>
                  downloadPreparerAttachment(file.id, file.fileName)
                }
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

  // File attachments component for payment completion files
  const PaymentFileAttachments = ({ attachments }) => {
    if (!attachments || attachments.length === 0) {
      return null;
    }

    return (
      <div className="approver-payment-attachments-section">
        <h5 className="approver-attachments-title">
          Payment Completion Attachments ({attachments.length})
        </h5>
        <div className="approver-attachments-grid">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="approver-payment-attachment-item"
            >
              <div className="approver-payment-attachment-info">
                <span className="approver-payment-attachment-name">
                  {attachment.fileName}
                </span>
                <span className="approver-payment-attachment-size">
                  {formatFileSize(attachment.fileSize)}
                </span>
                <span className="approver-payment-attachment-date">
                  {new Date(attachment.uploadDate).toLocaleDateString()}
                </span>
                <span className="approver-payment-attachment-uploader">
                  Uploaded by: {attachment.uploadedBy}
                </span>
              </div>
              <button
                onClick={() =>
                  downloadPaymentAttachment(attachment.id, attachment.fileName)
                }
                className="approver-payment-attachment-button"
              >
                ⬇️ Download
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Separate tables by priority
  const PriorityTables = ({ pendingData }) => {
    if (!pendingData || pendingData.length === 0) {
      return (
        <div className="approver-empty-state">
          <div className="approver-empty-icon">📋</div>
          <p className="approver-empty-text">No pending approvals found</p>
        </div>
      );
    }

    // Separate data by priority
    const firstPriorityData = pendingData.filter(
      (entry) => entry.priorityName === "First Priority"
    );
    const secondPriorityData = pendingData.filter(
      (entry) => entry.priorityName === "Second Priority"
    );

    const renderPriorityTable = (data, priorityName, priorityClass) => {
      if (data.length === 0) return null;

      const totalRequestedAmount = data.reduce(
        (sum, entry) => sum + (parseFloat(entry.paymentDue) || 0),
        0
      );

      return (
        <div className={`priority-table-container ${priorityClass}`}>
          <h3 className="priority-table-title">
            {priorityName} ({data.length} entries)
          </h3>
          <div className="table-responsive">
            <table className="pending-aging-table">
              <thead>
                <tr>
                  <th>Details of Aging</th>
                  <th>S.No</th>
                  <th>Supplier</th>
                  <th>Requested On</th>
                  <th>Overdue</th>
                  <th>Requested Amount</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, index) => (
                  <tr key={entry.id} className="pending-aging-row">
                    <td className="aging-details">{entry.remarks || "N/A"}</td>
                    <td className="serial-number">{index + 1}</td>
                    <td className="supplier-name">{entry.vendorName}</td>
                    <td className="requested-date">
                      {new Date(
                        entry.preparedByCreatedDate
                      ).toLocaleDateString()}
                    </td>
                    <td className="overdue-amount">
                      SAR{" "}
                      {parseFloat(
                        entry.balanceAsPerSupplier || 0
                      ).toLocaleString()}
                    </td>
                    <td className="requested-amount">
                      SAR {parseFloat(entry.paymentDue || 0).toLocaleString()}
                    </td>
                    <td className="remarks">
                      {entry.priorityName || "No priority"}
                    </td>
                    <td className="action-buttons">
                      <button
                        className="approver-approve-button table-btn"
                        onClick={() => handleApprove(entry)}
                        title="Approve"
                      >
                        ✅
                      </button>
                      <button
                        className="approver-return-button table-btn"
                        onClick={() => handleReturnToVerifier(entry.id)}
                        title="Return to Verifier"
                      >
                        ↩️
                      </button>
                      <button
                        className="approver-reject-button table-btn"
                        onClick={() => handleReject(entry.id)}
                        title="Reject"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="pending-aging-total">
                  <td colSpan="5">Total</td>
                  <td className="total-requested">
                    SAR {totalRequestedAmount.toLocaleString()}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="priority-tables-container">
        {renderPriorityTable(
          firstPriorityData,
          "First Priority",
          "first-priority"
        )}
        {renderPriorityTable(
          secondPriorityData,
          "Second Priority",
          "second-priority"
        )}
      </div>
    );
  };

  // Single table view
  const PendingAgingTable = ({ pendingData }) => {
    if (!pendingData || pendingData.length === 0) {
      return (
        <div className="approver-empty-state">
          <div className="approver-empty-icon">📋</div>
          <p className="approver-empty-text">No pending approvals found</p>
        </div>
      );
    }

    const totalRequestedAmount = pendingData.reduce(
      (sum, entry) => sum + (parseFloat(entry.paymentDue) || 0),
      0
    );

    return (
      <div className="pending-aging-table-container">
        <div className="table-responsive">
          <table className="pending-aging-table">
            <thead>
              <tr>
                <th>Details of Aging</th>
                <th>S.No</th>
                <th>Supplier</th>
                <th>Requested On</th>
                <th>Overdue</th>
                <th>Requested Amount</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingData.map((entry, index) => (
                <tr key={entry.id} className="pending-aging-row">
                  <td className="aging-details">{entry.remarks || "N/A"}</td>
                  <td className="serial-number">{index + 1}</td>
                  <td className="supplier-name">{entry.vendorName}</td>
                  <td className="requested-date">
                    {new Date(entry.preparedByCreatedDate).toLocaleDateString()}
                  </td>
                  <td className="overdue-amount">
                    SAR{" "}
                    {parseFloat(
                      entry.balanceAsPerSupplier || 0
                    ).toLocaleString()}
                  </td>
                  <td className="requested-amount">
                    SAR {parseFloat(entry.paymentDue || 0).toLocaleString()}
                  </td>
                  <td className="remarks">
                    {entry.priorityName || "No priority"}
                  </td>
                  <td className="action-buttons">
                    <button
                      className="approver-approve-button table-btn"
                      onClick={() => handleApprove(entry)}
                      title="Approve"
                    >
                      ✅
                    </button>
                    <button
                      className="approver-return-button table-btn"
                      onClick={() => handleReturnToVerifier(entry.id)}
                      title="Return to Verifier"
                    >
                      ↩️
                    </button>
                    <button
                      className="approver-reject-button table-btn"
                      onClick={() => handleReject(entry.id)}
                      title="Reject"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="pending-aging-total">
                <td colSpan="5">Total</td>
                <td className="total-requested">
                  SAR {totalRequestedAmount.toLocaleString()}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderPaymentCompletionCard = (entry) => {
    const isExpanded = isCardExpanded(entry.id);

    return (
      <div key={entry.id} className="approver-payment-card">
        <div
          className="approver-payment-header approver-payment-card-header-clickable"
          onClick={() => toggleCard(entry.id)}
        >
          <div className="approver-payment-header-left">
            <div className="approver-entry-title-section">
              <h3 className="approver-entry-title">
                Request Transfer #{entry.id} - Vendor: {entry.vendorName}
              </h3>
              {entry.isResubmitted && (
                <span className="approver-resubmitted-badge">
                  🔄 Resubmitted
                </span>
              )}
            </div>
            {!isExpanded && (
              <div className="approver-payment-collapsed-info">
                {/* <span className="approver-payment-collapsed-amount">
                  Amount: SAR{" "}
                  {entry.paymentDue !== undefined && entry.paymentDue !== null
                    ? parseFloat(entry.paymentDue || 0).toLocaleString()
                    : entry.amount !== undefined && entry.amount !== null
                    ? parseFloat(entry.amount || 0).toLocaleString()
                    : "N/A"}
                </span> */}
                {/* <span className="approver-payment-collapsed-percentage">
                  {entry.completionPercentage || 0}% Complete
                </span> */}
              </div>
            )}
          </div>

          <div className="approver-payment-header-right">
            <div className="approver-completion-status">
              {entry.isFullyCompleted && (
                <span className="approver-completion-badge">✅ Complete</span>
              )}
              {entry.isResubmitted && !entry.isFullyCompleted && (
                <span className="approver-reset-badge">🔄 Payment Reset</span>
              )}
              <div className="approver-progress-container">
                <div
                  className={`approver-progress-bar ${getProgressClass(
                    entry.completionPercentage
                  )}`}
                  style={{ width: `${entry.completionPercentage}%` }}
                />
              </div>
              <span className="approver-progress-text">
                {entry.completionPercentage}%
              </span>
            </div>
            <span className="approver-toggle-icon">
              {isExpanded ? "▼" : "▶"}
            </span>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Show preparer's attachments in payment completion view */}
            {entry.preparerAttachments && (
              <PreparerFileAttachments
                attachments={entry.preparerAttachments}
              />
            )}

            <div className="approver-entry-details">
              <div className="approver-detail-item">
                <span className="approver-detail-label">Prepared by</span>
                <span className="approver-detail-value">
                  {entry.preparedBy}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Vendor</span>
                <span className="approver-detail-value">
                  {entry.vendorName}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Bank</span>
                <span className="approver-detail-value">
                  {entry.vendorBank} - {entry.vendorBankAcc}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Adma Balance</span>
                <span className="approver-detail-value">
                  SAR: {entry.admabalance}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Supplier Balance</span>
                <span className="approver-detail-value">
                  SAR: {entry.supplierbalance}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Difference</span>
                <span className="approver-detail-value">
                  SAR {entry.amount}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Prepared Date</span>
                <span className="approver-detail-value">
                  {new Date(entry.preparedDate).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Show resubmission info */}
            {entry.isResubmitted && (
              <div className="approver-resubmission-info">
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Approval Count</span>
                  <span className="approver-detail-value">
                    {entry.approvalCount} time(s)
                  </span>
                </div>
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Latest Approval</span>
                  <span className="approver-detail-value">
                    {new Date(entry.latestApprovalDate).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {entry.paymentCompletion && (
              <div className="approver-payment-details">
                <h4 className="approver-payment-title">
                  Payment Completion Status
                </h4>

                <div className="approver-payment-grid">
                  <div className="approver-payment-item">
                    <div
                      className={`approver-payment-icon ${
                        entry.paymentCompletion.paymentDone
                          ? "approver-payment-done"
                          : "approver-payment-pending"
                      }`}
                    >
                      {entry.paymentCompletion.paymentDone ? "✓" : "✗"}
                    </div>
                    <div className="approver-payment-label">Payment</div>
                    {entry.paymentCompletion.paymentDoneDate && (
                      <div className="approver-payment-date">
                        {new Date(
                          entry.paymentCompletion.paymentDoneDate
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="approver-payment-item">
                    <div
                      className={`approver-payment-icon ${
                        entry.paymentCompletion.odooEntryDone
                          ? "approver-payment-done"
                          : "approver-payment-pending"
                      }`}
                    >
                      {entry.paymentCompletion.odooEntryDone ? "✓" : "✗"}
                    </div>
                    <div className="approver-payment-label">Odoo Entry</div>
                    {entry.paymentCompletion.odooEntryDoneDate && (
                      <div className="approver-payment-date">
                        {new Date(
                          entry.paymentCompletion.odooEntryDoneDate
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="approver-payment-item">
                    <div
                      className={`approver-payment-icon ${
                        entry.paymentCompletion.attachmentsDone
                          ? "approver-payment-done"
                          : "approver-payment-pending"
                      }`}
                    >
                      {entry.paymentCompletion.attachmentsDone ? "✓" : "✗"}
                    </div>
                    <div className="approver-payment-label">Attachments</div>
                    {entry.paymentCompletion.attachmentsDoneDate && (
                      <div className="approver-payment-date">
                        {new Date(
                          entry.paymentCompletion.attachmentsDoneDate
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Show payment completion attachments */}
                {entry.paymentCompletion.attachments && (
                  <PaymentFileAttachments
                    attachments={entry.paymentCompletion.attachments}
                  />
                )}

                {entry.paymentCompletion?.odooReferenceNumber && (
                  <div className="approver-detail-item">
                    <span className="approver-detail-label">
                      Odoo Reference Number
                    </span>
                    <span className="approver-detail-value">
                      {entry.paymentCompletion.odooReferenceNumber}
                    </span>
                  </div>
                )}

                <div className="approver-detail-item">
                  <span className="approver-detail-label">Last updated</span>
                  <span className="approver-detail-value">
                    {new Date(
                      entry.paymentCompletion.lastUpdatedDate
                    ).toLocaleString()}{" "}
                    by {entry.paymentCompletion.updatedBy}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
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

  const renderEntryCard = (entry, showActions = true) => {
    const isExpanded = isCardExpanded(entry.id);

    return (
      <div key={entry.id} className="approver-entry-card">
        <div
          className="approver-entry-header approver-card-header-clickable"
          onClick={() => toggleCard(entry.id)}
        >
          <div className="approver-entry-title-section">
            <div className="approver-header-left">
              <h3 className="approver-entry-title">
                Request Transfer #{entry.id} - {entry.vendorName}
              </h3>
              {entry.isResubmitted && (
                <span className="approver-resubmitted-badge">
                  🔄 Resubmitted
                </span>
              )}
              {!isExpanded && (
                <div className="approver-collapsed-payment-due">
                  <span className="approver-payment-due-label">
                    Payment Due:
                  </span>
                  <span className="approver-payment-due-value">
                    SAR{" "}
                    {parseFloat(entry.paymentDue || 0).toLocaleString() ||
                      "N/A"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="approver-header-right">
            <span
              className={`approver-status-badge ${getStatusClass(
                entry.currentStatus
              )}`}
            >
              {entry.currentStatus}
            </span>
            {entry.priorityName && (
              <span
                className={`priority-badge priority-${entry.priorityName
                  ?.toLowerCase()
                  .replace(" ", "-")}`}
              >
                {/* {entry.priorityName} */}
              </span>
            )}
            <span className="approver-toggle-icon">
              {isExpanded ? "▼" : "▶"}
            </span>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Show preparer's attachments for all entry types */}
            {entry.preparerAttachments && (
              <PreparerFileAttachments
                attachments={entry.preparerAttachments}
              />
            )}

            {/* Add resubmission info if available */}
            {entry.isResubmitted && (
              <div className="approver-resubmission-info">
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Approval Count</span>
                  <span className="approver-detail-value">
                    {entry.approvalCount} time(s)
                  </span>
                </div>
                {entry.firstApprovalDate && (
                  <div className="approver-detail-item">
                    <span className="approver-detail-label">
                      First Approved
                    </span>
                    <span className="approver-detail-value">
                      {new Date(entry.firstApprovalDate).toLocaleString()}
                    </span>
                  </div>
                )}
                {entry.latestApprovalDate && (
                  <div className="approver-detail-item">
                    <span className="approver-detail-label">
                      Latest Approved
                    </span>
                    <span className="approver-detail-value">
                      {new Date(entry.latestApprovalDate).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="approver-entry-details">
              <div className="approver-detail-item">
                <span className="approver-detail-label">Prepared by</span>
                <span className="approver-detail-value">
                  {entry.preparedBy}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Vendor</span>
                <span className="approver-detail-value">
                  {entry.vendorName}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Priority</span>
                <span className="approver-detail-value">
                  {entry.priorityName || "Not specified"}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Bank</span>
                <span className="approver-detail-value">
                  {entry.vendorBank} - {entry.vendorBankAcc}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Branch</span>
                <span className="approver-detail-value">
                  {entry.vendorBranch}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Adma Balance</span>
                <span className="approver-detail-value">
                  SAR: {entry.balanceAsPerAdmaShamran}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Supplier Balance</span>
                <span className="approver-detail-value">
                  SAR: {entry.balanceAsPerSupplier}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Difference</span>
                <span className="approver-detail-value">
                  SAR: {entry.difference}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">
                  Reason for Difference
                </span>
                <span className="approver-detail-value">
                  {entry.reasonOFDifference}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Payment Due</span>
                <span className="approver-detail-value">
                  SAR {parseFloat(entry.paymentDue || 0).toLocaleString()}
                </span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Remarks</span>
                <span className="approver-detail-value">{entry.remarks}</span>
              </div>
              <div className="approver-detail-item">
                <span className="approver-detail-label">Prepared Date</span>
                <span className="approver-detail-value">
                  {new Date(entry.preparedByCreatedDate).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Update approval history section to show all approvals for resubmitted entries */}
            {entry.allApprovals && entry.allApprovals.length > 0 && (
              <div className="approver-history-section approval">
                <p className="approver-history-title">
                  📋 Approval History ({entry.allApprovals.length})
                </p>
                {entry.allApprovals.map((approval, index) => (
                  <div key={index} className="approver-approval-item">
                    <div className="approver-detail-item">
                      <span className="approver-detail-label">
                        Approval {index + 1}
                      </span>
                      <span className="approver-detail-value">
                        by {approval.approvedBy} on{" "}
                        {new Date(approval.approvedDate).toLocaleString()}
                      </span>
                    </div>
                    {approval.remarks && (
                      <div className="approver-detail-item">
                        <span className="approver-detail-label">Remarks</span>
                        <span className="approver-detail-value">
                          {approval.remarks}
                        </span>
                      </div>
                    )}
                    {approval.otherAmount > 0 && (
                      <div className="approver-detail-item">
                        <span className="approver-detail-label">
                          Additional Amount
                        </span>
                        <span className="approver-detail-value">
                          SAR {approval.otherAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {entry.approvalHistory && !entry.allApprovals && (
              <div className="approver-history-section approval">
                <p className="approver-history-title">✅ Approval Details</p>
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Approved by</span>
                  <span className="approver-detail-value">
                    {entry.approvalHistory.approvedBy}
                  </span>
                </div>
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Remarks</span>
                  <span className="approver-detail-value">
                    {entry.approvalHistory.remarks}
                  </span>
                </div>
                {entry.approvalHistory.otherAmount > 0 && (
                  <div className="approver-detail-item">
                    <span className="approver-detail-label">
                      Additional Amount
                    </span>
                    <span className="approver-detail-value">
                      SAR {entry.approvalHistory.otherAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Date</span>
                  <span className="approver-detail-value">
                    {new Date(
                      entry.approvalHistory.approvedDate
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {entry.verificationHistory && (
              <div className="approver-history-section verification">
                <p className="approver-history-title">
                  ✅ Verification Details
                </p>
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Verified by</span>
                  <span className="approver-detail-value">
                    {entry.verificationHistory.verifiedBy}
                  </span>
                </div>
                <div className="approver-detail-item">
                  <span className="approver-detail-label">
                    Verifier Remarks
                  </span>
                  <span className="approver-detail-value">
                    {entry.verificationHistory.remarks}
                  </span>
                </div>
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Verified Date</span>
                  <span className="approver-detail-value">
                    {new Date(
                      entry.verificationHistory.verifiedDate
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {entry.paymentCompletion && (
              <div className="approver-history-section approval">
                <p className="approver-history-title">Payment Completion</p>
                <div className="approver-detail-item">
                  <span className="approver-detail-label">Status</span>
                  <span className="approver-detail-value">
                    {entry.isFullyCompleted ? "✅ Complete" : "🔄 In Progress"}
                  </span>
                </div>
                {entry.paymentCompletion.attachmentCount > 0 && (
                  <div className="approver-detail-item">
                    <span className="approver-detail-label">Attachments</span>
                    <span className="approver-detail-value">
                      {entry.paymentCompletion.attachmentCount} files
                    </span>
                  </div>
                )}
              </div>
            )}

            {showActions && entry.currentStatus === "Verified" && (
              <div className="approver-action-buttons">
                <button
                  className="approver-approve-button"
                  onClick={() => handleApprove(entry)}
                >
                  ✅ Approve
                </button>

                <button
                  className="approver-return-button"
                  onClick={() => handleReturnToVerifier(entry.id)}
                >
                  ↩️ Return to Verifier
                </button>

                <button
                  className="approver-reject-button"
                  onClick={() => handleReject(entry.id)}
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading)
    return <div className="approver-loading">Loading entries...</div>;

  const counts = getTabCounts();

  return (
    <div className="approver-dashboard-container">
      {!isSidebarOpen && (
        <button
          className="approver-menu-toggle"
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
          className="approver-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="approver-dashboard-shell">
        <aside
          className={`approver-sidebar ${isSidebarOpen ? "open" : "collapsed"}`}
        >
          <button
            className="approver-sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
          <div>
            <div className="approver-sidebar-header">
              <h2>Approver</h2>
              <p>{user?.username || "User"}</p>
            </div>
            <nav className="approver-sidebar-nav">
              <button
                className="approver-sidebar-button"
                onClick={() => {
                  handleReport();
                  closeSidebarOnSmall();
                }}
              >
                📊 Expected Cash Flow
              </button>
              <button
                className={`approver-sidebar-button ${
                  isProfileOpen ? "active" : ""
                }`}
                onClick={() => setIsProfileOpen((prev) => !prev)}
              >
                👤 Profile
              </button>
            </nav>
            {isProfileOpen && (
              <div className="approver-profile-card">
                <div className="approver-profile-grid">
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
                    <div key={item.label} className="approver-profile-item">
                      <span className="approver-profile-label">
                        {item.label}
                      </span>
                      <span className="approver-profile-value">
                        {item.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
                <form
                  className="approver-profile-form"
                  onSubmit={handleProfileSubmit}
                >
                  <label
                    className="approver-profile-form-label"
                    htmlFor="approver-profile-new-password"
                  >
                    New Password
                  </label>
                  <input
                    id="approver-profile-new-password"
                    type="password"
                    className="approver-profile-input"
                    placeholder="Enter a new password"
                    value={profileForm.newPassword}
                    onChange={handleProfilePasswordChange}
                  />
                  <button
                    type="submit"
                    className="approver-profile-submit"
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}
          </div>
          <button className="approver-sidebar-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </aside>

        <div className="approver-dashboard-main">
          <div className="approver-dashboard-header">
            <div className="approver-header-title">
              <h1>Dashboard</h1>
              <p>
                Welcome, <strong>{user?.username || "User"}</strong>
              </p>
            </div>
          </div>

          {/* FILTERS SECTION */}
          <div className="approver-filters-section">
            <h3>Filters</h3>
            <div className="approver-filters-grid">
              {/* Branch Filter */}
              <div className="approver-filter-group">
                <label className="approver-filter-label">Branch:</label>
                <select
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  className="approver-filter-input"
                >
                  <option value="all">All Branches</option>
                  <option value="riyadh">Riyadh</option>
                  <option value="dammam">Dammam</option>
                  <option value="madinah">Madinah</option>
                  <option value="jeddah">Jeddah</option>
                  <option value="tabuk">Tabuk</option>
                  <option value="qasim">Qasim</option>
                  <option value="hail">Hail</option>
                  <option value="abha">Abha</option>
                </select>
              </div>

              {/* Date From Filter */}
              <div className="approver-filter-group">
                <label className="approver-filter-label">From Date:</label>
                <input
                  type="date"
                  name="fromDate"
                  value={dateFilter.fromDate}
                  onChange={handleDateFilterChange}
                  className="approver-filter-input"
                />
              </div>

              {/* Date To Filter */}
              <div className="approver-filter-group">
                <label className="approver-filter-label">To Date:</label>
                <input
                  type="date"
                  name="toDate"
                  value={dateFilter.toDate}
                  onChange={handleDateFilterChange}
                  className="approver-filter-input"
                />
              </div>

              {/* Filter Actions */}
              <div className="approver-filter-actions">
                <button
                  className="approver-action-button approver-apply-button"
                  onClick={applyFilters}
                >
                  🔍 Apply Filters
                </button>
                <button
                  className="approver-action-button approver-clear-button"
                  onClick={clearFilters}
                >
                  🗑️ Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="approver-tabs-container">
            <div className="approver-tabs">
              {[
                {
                  key: "pending",
                  label: "Pending Approval",
                  count: counts.pending,
                },
                { key: "approved", label: "Approved", count: counts.approved },
                {
                  key: "paymentCompletion",
                  label: "Payment Tracking",
                  count: counts.paymentCompletion,
                },
                { key: "rejected", label: "Rejected", count: counts.rejected },
                {
                  key: "returnedToVerifier",
                  label: "Returned to Verifier",
                  count: counts.returnedToVerifier,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`approver-tab ${
                    activeTab === tab.key ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span className="approver-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="approver-entries-container">
            {activeTab === "pending" && (
              <div>
                <h2>Pending Approval (Verified Entries) ({counts.pending})</h2>

                {/* View Toggle for Pending Tab Only */}
                <div className="view-toggle">
                  <button
                    className={`toggle-btn ${
                      activeView === "priority" ? "active" : ""
                    }`}
                    onClick={() => setActiveView("priority")}
                  >
                    Priority Tables
                  </button>
                  <button
                    className={`toggle-btn ${
                      activeView === "cards" ? "active" : ""
                    }`}
                    onClick={() => setActiveView("cards")}
                  >
                    Card View
                  </button>
                </div>

                {dashboardData.pending.length === 0 ? (
                  <div className="approver-empty-state">
                    <div className="approver-empty-icon">📋</div>
                    <p className="approver-empty-text">
                      No pending approvals found
                    </p>
                  </div>
                ) : activeView === "priority" ? (
                  <PriorityTables pendingData={dashboardData.pending} />
                ) : activeView === "table" ? (
                  <PendingAgingTable pendingData={dashboardData.pending} />
                ) : (
                  dashboardData.pending.map((entry) =>
                    renderEntryCard(entry, true)
                  )
                )}
              </div>
            )}

            {activeTab === "approved" && (
              <div>
                <h2>Approved Entries ({counts.approved})</h2>
                {dashboardData.approved.length === 0 ? (
                  <div className="approver-empty-state">
                    <div className="approver-empty-icon">✅</div>
                    <p className="approver-empty-text">No approved entries</p>
                  </div>
                ) : (
                  dashboardData.approved.map((entry) =>
                    renderEntryCard(entry, false)
                  )
                )}
              </div>
            )}

            {activeTab === "paymentCompletion" && (
              <div>
                <h2>
                  Payment Completion Tracking ({counts.paymentCompletion})
                </h2>
                {dashboardData.paymentCompletion.length === 0 ? (
                  <div className="approver-empty-state">
                    <div className="approver-empty-icon">💰</div>
                    <p className="approver-empty-text">
                      No payment entries to track
                    </p>
                  </div>
                ) : (
                  dashboardData.paymentCompletion.map((entry) =>
                    renderPaymentCompletionCard(entry)
                  )
                )}
              </div>
            )}

            {activeTab === "rejected" && (
              <div>
                <h2>Rejected Entries ({counts.rejected})</h2>
                {dashboardData.rejected.length === 0 ? (
                  <div className="approver-empty-state">
                    <div className="approver-empty-icon">❌</div>
                    <p className="approver-empty-text">No rejected entries</p>
                  </div>
                ) : (
                  dashboardData.rejected.map((entry) =>
                    renderEntryCard(entry, false)
                  )
                )}
              </div>
            )}

            {activeTab === "returnedToVerifier" && (
              <div>
                <h2>Returned to Verifier ({counts.returnedToVerifier})</h2>
                {dashboardData.returnedToVerifier.length === 0 ? (
                  <div className="approver-empty-state">
                    <div className="approver-empty-icon">↩️</div>
                    <p className="approver-empty-text">
                      No entries returned to verifier
                    </p>
                  </div>
                ) : (
                  dashboardData.returnedToVerifier.map((entry) =>
                    renderEntryCard(entry, false)
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReturnAndRejectModal
        isOpen={modalState.isOpen && modalState.type !== "approve"}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        title={
          modalState.type === "reject"
            ? "Rejection reason"
            : "Return to Verifier"
        }
        placeholder={
          modalState.type === "reject"
            ? "Please enter rejection reason..."
            : "Please enter reason for returning to verifier..."
        }
      />

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={modalState.isOpen && modalState.type === "approve"}
        onClose={closeModal}
        onSubmit={handleApprovalSubmit}
        entry={modalState.entry}
      />

      <ToastContainer />
    </div>
  );
}
