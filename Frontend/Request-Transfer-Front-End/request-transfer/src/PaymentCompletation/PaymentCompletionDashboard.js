import React, { useState, useEffect } from "react";
import API from "../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "./PaymentCompletation.css";

// UpdateStatusModal component
const UpdateStatusModal = ({
  selectedPayment,
  statusForm,
  setStatusForm,
  odooReferenceNumber,
  setOdooReferenceNumber,
  setShowUpdateModal,
  handleStatusUpdate,
  openAttachmentModal,
}) => {
  if (!selectedPayment) return null;

  const handlePaymentDoneChange = (isChecked) => {
    setStatusForm((prev) => ({
      ...prev,
      paymentDone: isChecked,
      attachmentsDone: isChecked ? prev.attachmentsDone : false,
      odooEntryDone: isChecked ? prev.odooEntryDone : false,
    }));

    if (!isChecked) {
      setOdooReferenceNumber("");
    }
  };

  const handleAttachmentsDoneChange = (isChecked) => {
    setStatusForm((prev) => ({
      ...prev,
      attachmentsDone: isChecked,
      odooEntryDone: isChecked ? prev.odooEntryDone : false,
    }));

    if (!isChecked) {
      setOdooReferenceNumber("");
    }
  };

  const handleOdooEntryChange = (isChecked) => {
    setStatusForm((prev) => ({
      ...prev,
      odooEntryDone: isChecked,
    }));

    if (!isChecked) {
      setOdooReferenceNumber("");
    }
  };

  const handleUpdateAndContinue = () => {
    if (statusForm.paymentDone && !statusForm.attachmentsDone) {
      handleStatusUpdate(selectedPayment.id);
    } else {
      handleStatusUpdate(selectedPayment.id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Update Payment Status - Entry #{selectedPayment.id}</h2>

        <div className="modal-payment-info">
          <p>
            <strong>Vendor:</strong> {selectedPayment.vendorName}
          </p>
          <p>
            <strong>Adma Balance:</strong> SAR{" "}
            {selectedPayment.balanceAsPerAdmaShamran}
          </p>
          <p>
            <strong>Supplier Balance:</strong> SAR{" "}
            {selectedPayment.balanceAsPerSupplier}
          </p>
          <p>
            <strong>Difference:</strong> SAR {selectedPayment.difference}
          </p>
          <p>
            <strong>Payment Due:</strong> SAR {selectedPayment.paymentDue}
          </p>
        </div>

        <div className="completion-steps-modal">
          <h4>Completion Steps</h4>

          <label
            className={`step-label ${
              statusForm.paymentDone ? "completed" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={statusForm.paymentDone}
              onChange={(e) => handlePaymentDoneChange(e.target.checked)}
            />
            Payment Processed
          </label>

          <div
            className={`step-label attachments-step ${
              statusForm.attachmentsDone ? "completed" : ""
            } ${!statusForm.paymentDone ? "disabled" : ""}`}
          >
            <label>
              <input
                type="checkbox"
                checked={statusForm.attachmentsDone}
                disabled={!statusForm.paymentDone}
                onChange={(e) => handleAttachmentsDoneChange(e.target.checked)}
              />
              All Attachments Uploaded
              <span className="required-star">*</span>
            </label>

            <button
              onClick={() => {
                setShowUpdateModal(false);
                setTimeout(() => openAttachmentModal(selectedPayment), 100);
              }}
              disabled={!statusForm.paymentDone}
              className={`attachment-upload-btn ${
                !statusForm.paymentDone ? "disabled" : ""
              }`}
            >
              📎 Upload Attachments
            </button>

            {!statusForm.paymentDone && (
              <div className="step-help">
                Complete "Payment Processed" first to upload attachments
              </div>
            )}
          </div>

          <label
            className={`step-label ${
              statusForm.odooEntryDone ? "completed" : ""
            } ${
              !(statusForm.paymentDone && statusForm.attachmentsDone)
                ? "disabled"
                : ""
            }`}
          >
            <input
              type="checkbox"
              checked={statusForm.odooEntryDone}
              disabled={!(statusForm.paymentDone && statusForm.attachmentsDone)}
              onChange={(e) => handleOdooEntryChange(e.target.checked)}
            />
            Odoo Entry Completed
            <span className="required-star">*</span>
          </label>
        </div>

        <div className="odoo-reference-input">
          <label>
            Odoo Reference Number:
            {statusForm.odooEntryDone && (
              <span className="required-star">*</span>
            )}
          </label>
          <input
            type="text"
            value={odooReferenceNumber}
            onChange={(e) => {
              const newValue = e.target.value.slice(0, 20);
              setOdooReferenceNumber(newValue);
            }}
            placeholder="Enter the Odoo Reference Number"
            disabled={!statusForm.odooEntryDone}
            className={
              statusForm.odooEntryDone && !odooReferenceNumber.trim()
                ? "error"
                : ""
            }
          />

          {statusForm.odooEntryDone && !odooReferenceNumber?.trim() && (
            <div className="input-error">
              Odoo Reference Number is required when Odoo Entry is completed.{" "}
              <strong>(Kindly Copy & Paste your reference)</strong>
            </div>
          )}
          {!statusForm.odooEntryDone && (
            <div className="input-help">
              Complete previous steps to enable Odoo Entry
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            onClick={() => setShowUpdateModal(false)}
            className="modal-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateAndContinue}
            disabled={statusForm.odooEntryDone && !odooReferenceNumber.trim()}
            className={`modal-submit-btn ${
              statusForm.odooEntryDone && !odooReferenceNumber.trim()
                ? "disabled"
                : ""
            }`}
          >
            {statusForm.paymentDone && !statusForm.attachmentsDone
              ? "Update & Continue to Attachments"
              : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Details Modal Component
// Enhanced Details Modal Component with Column Layout
const EnhancedDetailsModal = ({
  selectedPayment,
  setShowDetailsModal,
  downloadAttachment,
}) => {
  if (!selectedPayment) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content extra-large">
        <div className="modal-header">
          {/* <h2>Complete Payment History - Entry #{selectedPayment.id}</h2> */}
          <button
            onClick={() => setShowDetailsModal(false)}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Payment Information Section - Compact Row Layout */}
          <div className="payment-info-compact-section">
            <div className="payment-info-header">Payment Information</div>
            <div className="payment-info-rows">
              {/* Row 1: Supplier Name and Adma Balance */}
              <div className="payment-info-row">
                <div className="payment-info-field">
                  <span className="payment-info-label">Supplier Name</span>
                  <span className="payment-info-value">
                    {selectedPayment.vendorName || "N/A"}
                  </span>
                </div>
                <div className="payment-info-field">
                  <span className="payment-info-label">Adma Balance</span>
                  <span className="payment-info-value">
                    SAR {selectedPayment.balanceAsPerAdmaShamran || "0"}
                  </span>
                </div>
              </div>

              {/* Row 2: Supplier Balance and Difference */}
              <div className="payment-info-row">
                <div className="payment-info-field">
                  <span className="payment-info-label">Supplier Balance</span>
                  <span className="payment-info-value">
                    SAR {selectedPayment.balanceAsPerSupplier || "0"}
                  </span>
                </div>
                <div className="payment-info-field">
                  <span className="payment-info-label">Difference</span>
                  <span className="payment-info-value">
                    SAR {selectedPayment.difference || "0"}
                  </span>
                </div>
              </div>

              {/* Row 3: Payment Due, Remarks, and Reason of Difference */}
              <div className="payment-info-row">
                <div className="payment-info-field">
                  <span className="payment-info-label">Payment Due</span>
                  <span className="payment-info-value">
                    {selectedPayment.paymentDue || "N/A"}
                  </span>
                </div>
                <div className="payment-info-field">
                  <span className="payment-info-label">Remarks</span>
                  <span className="payment-info-value">
                    {selectedPayment.remarks || "N/A"}
                  </span>
                </div>
                <div className="payment-info-field">
                  <span className="payment-info-label">
                    Reason of Difference
                  </span>
                  <span className="payment-info-value">
                    {selectedPayment.reasonOFDifference || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* History Section - All three columns in one row */}
          <div className="history-section-compact">
            <div className="history-columns-row">
              {/* Prepared by */}
              <div className="history-column-compact">
                <div className="history-column-header">Prepared by</div>
                <div className="history-column-content">
                  <div className="history-detail-field">
                    <span className="history-detail-label">Name:</span>
                    <span className="history-detail-value">
                      {selectedPayment.preparedBy || "N/A"}
                    </span>
                  </div>
                  <div className="history-detail-field">
                    <span className="history-detail-label">Branch:</span>
                    <span className="history-detail-value">
                      {selectedPayment.preparedByBranch || "N/A"}
                    </span>
                  </div>
                  <div className="history-detail-field">
                    <span className="history-detail-label">Date:</span>
                    <span className="history-detail-value">
                      {selectedPayment.preparedByCreatedDate
                        ? new Date(
                            selectedPayment.preparedByCreatedDate
                          ).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification History */}
              <div className="history-column-compact">
                <div className="history-column-header">Verification</div>
                <div className="history-column-content">
                  {selectedPayment.verificationHistory?.length > 0 ? (
                    selectedPayment.verificationHistory.map(
                      (verification, index) => (
                        <div key={index} className="history-item-compact">
                          {/* <div className="history-item-header-compact">
                            <span className="history-item-number">
                              Verification #{index + 1}
                            </span>
                            <span className="history-status-badge verified">
                              {verification.status || "Verified"}
                            </span>
                          </div> */}
                          <div className="history-item-details-compact">
                            <div className="history-detail-field">
                              <span className="history-detail-label">
                                Name:
                              </span>
                              <span className="history-detail-value">
                                {verification.verifiedBy || "N/A"}
                              </span>
                            </div>
                            <div className="history-detail-field">
                              <span className="history-detail-label">
                                Date:
                              </span>
                              <span className="history-detail-value">
                                {verification.verifiedDate
                                  ? new Date(
                                      verification.verifiedDate
                                    ).toLocaleString()
                                  : "N/A"}
                              </span>
                            </div>
                            {verification.remarks && (
                              <div className="history-detail-field">
                                <span className="history-detail-label">
                                  Remarks:
                                </span>
                                <span className="history-detail-value">
                                  {verification.remarks}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="no-data-compact">
                      <p>No verification history</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval History */}
              <div className="history-column-compact">
                <div className="history-column-header">Approval</div>
                <div className="history-column-content">
                  {selectedPayment.allApprovals?.length > 0 ? (
                    selectedPayment.allApprovals.map((approval, index) => (
                      <div key={index} className="history-item-compact">
                        {/* <div className="history-item-header-compact">
                          <span className="history-item-number">
                            Approval #{index + 1}
                          </span>
                          <span className="history-status-badge approved">
                            {approval.status || "Approved"}
                          </span>
                        </div> */}
                        <div className="history-item-details-compact">
                          <div className="history-detail-field">
                            <span className="history-detail-label">Name:</span>
                            <span className="history-detail-value">
                              {approval.approvedBy || "N/A"}
                            </span>
                          </div>
                          <div className="history-detail-field">
                            <span className="history-detail-label">Date:</span>
                            <span className="history-detail-value">
                              {approval.approvedDate
                                ? new Date(
                                    approval.approvedDate
                                  ).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                          <div className="history-detail-field">
                            <span className="history-detail-label">
                              Amount:
                            </span>
                            <span className="history-detail-value">
                              SAR {approval.otherAmount || "0"}
                            </span>
                          </div>
                          {approval.remarks && (
                            <div className="history-detail-field">
                              <span className="history-detail-label">
                                Remarks:
                              </span>
                              <span className="history-detail-value">
                                {approval.remarks}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data-compact">
                      <p>No approval history</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="modal-actions">
          <button
            onClick={() => setShowDetailsModal(false)}
            className="modal-cancel-btn"
          >
            Close
          </button>
        </div> */}
      </div>
    </div>
  );
};

// Attachment Modal Component
const AttachmentModal = ({
  selectedPayment,
  setShowAttachmentModal,
  uploadForm,
  setUploadForm,
  uploading,
  handleUpload,
  dashboardData,
  user,
}) => {
  if (!selectedPayment) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        e.target.value = "";
        return;
      }

      setUploadForm((prev) => ({ ...prev, File: file }));
    }
  };

  const currentPayment = dashboardData.approvedPayments.find(
    (p) => p.id === selectedPayment.id
  );
  const paymentCompletionId = currentPayment?.paymentCompletion?.id;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upload Attachment - Entry #{selectedPayment.id}</h2>

        <div className="modal-payment-info">
          <p>
            <strong>Vendor:</strong> {selectedPayment.vendorName}
          </p>
          <p>
            <strong>Amount:</strong> SAR {selectedPayment.difference}
          </p>
          <p
            className={`payment-completion-id ${
              paymentCompletionId ? "available" : "unavailable"
            }`}
          >
            <strong>Payment Completion ID:</strong>{" "}
            {paymentCompletionId || "Not available - Update status first"}
          </p>
        </div>

        <div className="file-upload-section">
          <label>Select File: *</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="file-input"
          />
          {uploadForm.File && (
            <p className="file-selected">
              ✅ Selected: {uploadForm.File.name} (
              {(uploadForm.File.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="file-upload-help">
          <strong>Supported files:</strong> PDF, Images, Documents (Max: 10MB)
        </div>

        <div className="modal-actions">
          <button
            onClick={() => setShowAttachmentModal(false)}
            disabled={uploading}
            className="modal-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !uploadForm.File || !paymentCompletionId}
            className={`modal-submit-btn ${
              !uploadForm.File || !paymentCompletionId ? "disabled" : ""
            }`}
          >
            {uploading ? "📤 Uploading..." : "📎 Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function PaymentCompletionDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("approved-payments");
  const [dashboardData, setDashboardData] = useState({
    approvedPayments: [],
    completionStatus: [],
  });
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  // Branch filter state
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [expandedCards, setExpandedCards] = useState(new Set());

  // Vendor search state
  const [vendorSearch, setVendorSearch] = useState("");

  // Branch filters configuration
  const branchFilters = {
    riyadh: ["Riyadh"],
    dammam: ["Dammam"],
    madinah: ["Madinah"],
    jeddah: ["Jeddah"],
    tabuk: ["Tabuk"],
    qasim: ["Qasim"],
    hail: ["Hail"],
    all: [],
  };

  // Form states
  const [statusForm, setStatusForm] = useState({
    paymentDone: false,
    odooEntryDone: false,
    attachmentsDone: false,
  });
  const [odooReferenceNumber, setOdooReferenceNumber] = useState("");

  const [uploadForm, setUploadForm] = useState({
    File: null,
    Description: "",
  });

  const backtodashboard = () => {
    navigate("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
    navigate("Auth");
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
        const startTime = Date.now();
        try {
          const response = await API.get(endpoint);
          const duration = Date.now() - startTime;
          const dataLength = Array.isArray(response.data)
            ? response.data.length
            : 0;
          console.log(
            `✅ ${endpoint} loaded in ${duration}ms (${dataLength} items)`
          );
          return response.data || defaultData;
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(
            `❌ Error fetching ${endpoint} after ${duration}ms:`,
            error
          );
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
      const [approvedPaymentsData, completionStatusData] = await Promise.all([
        fetchWithFallback(`/PaymentCompletion/approved-payments/${user.id}`),
        fetchWithFallback(`/PaymentCompletion/completion-status/${user.id}`),
      ]);

      const allData = {
        approvedPayments: approvedPaymentsData || [],
        completionStatus: completionStatusData || [],
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

  // Apply all filters (date + branch)
  const applyFilters = () => {
    setLoading(true);

    let filteredData = {};

    // Apply filters to each tab's data
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

      // Apply vendor name search filter
      if (vendorSearch.trim()) {
        const searchTerm = vendorSearch.trim().toLowerCase();
        filtered = filtered.filter((entry) =>
          entry.vendorName?.toLowerCase().includes(searchTerm)
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
    setVendorSearch("");
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

  // Handle vendor search change
  const handleVendorSearchChange = (e) => {
    setVendorSearch(e.target.value);
  };

  const handleStatusUpdate = async (preparedById) => {
    try {
      if (statusForm.odooEntryDone && !odooReferenceNumber.trim()) {
        toast.error(
          "❌ Odoo Reference Number is required when Odoo Entry is marked as completed.(Copy & Paste your reference please)"
        );
        return;
      }

      const payload = {
        ...statusForm,
        odooReferenceNumber: odooReferenceNumber,
        UpdatedByUserId: user.id,
      };

      const response = await API.post(
        `/PaymentCompletion/update-status/${preparedById}`,
        payload
      );

      toast.success("✅ Payment status updated successfully!");

      // Check if payment was just marked as processed and attachments are not done
      const wasPaymentJustProcessed =
        statusForm.paymentDone && !statusForm.attachmentsDone;

      setShowUpdateModal(false);

      if (response.data.updatedPayment) {
        setDashboardData((prev) => ({
          ...prev,
          approvedPayments: prev.approvedPayments.map((p) =>
            p.id === preparedById
              ? { ...p, ...response.data.updatedPayment }
              : p
          ),
          completionStatus: prev.completionStatus.map((p) =>
            p.id === preparedById
              ? { ...p, ...response.data.updatedPayment }
              : p
          ),
        }));

        // Update allEntries as well to keep filters in sync
        setAllEntries((prev) => ({
          ...prev,
          approvedPayments: prev.approvedPayments.map((p) =>
            p.id === preparedById
              ? { ...p, ...response.data.updatedPayment }
              : p
          ),
          completionStatus: prev.completionStatus.map((p) =>
            p.id === preparedById
              ? { ...p, ...response.data.updatedPayment }
              : p
          ),
        }));
      } else {
        fetchDashboardData();
      }

      // If payment was just processed, open attachment modal
      if (wasPaymentJustProcessed) {
        setTimeout(() => {
          const updatedPayment = dashboardData.approvedPayments.find(
            (p) => p.id === preparedById
          );
          openAttachmentModal(updatedPayment || selectedPayment);
        }, 500);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("❌ Failed to update payment status.");
    }
  };

  const handleViewDetails = async (preparedById) => {
    try {
      const response = await API.get(
        `/PaymentCompletion/payment-details/${preparedById}/${user.id}`
      );
      console.log("Payment details response:", response.data);
      console.log("Verification History:", response.data.verificationHistory);
      console.log("Approval History:", response.data.allApprovals);
      console.log("Payment Completions:", response.data.paymentCompletions);
      setSelectedPayment(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching payment details:", error);
      toast.error("❌ Failed to load payment details.");
    }
  };

  const downloadAttachment = async (attachmentId) => {
    try {
      const response = await API.get(
        `/PaymentCompletion/download-attachment/${attachmentId}`,
        { responseType: "blob" }
      );

      const contentType =
        response.headers["content-type"] || "application/octet-stream";

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      let fileName = `attachment_${attachmentId}`;
      const contentDisposition = response.headers["content-disposition"] || "";
      const fileNameMatch = contentDisposition.match(
        /filename\*?=(?:UTF-8'')?"?([^;\r\n"]+)/i
      );
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = decodeURIComponent(fileNameMatch[1].replace(/"/g, ""));
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Attachment downloaded successfully!");
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment.");
    }
  };

  const removeAttachment = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to remove this attachment?")) {
      return;
    }

    try {
      await API.delete(`/PaymentCompletion/remove-attachment/${attachmentId}`);
      toast.success("✅ Attachment removed successfully!");
      fetchDashboardData();
    } catch (error) {
      console.error("Error removing attachment:", error);
      toast.error("❌ Failed to remove attachment.");
    }
  };

  const openUpdateModal = (payment, preserveState = false) => {
    const currentCompletion = payment.paymentCompletion;
    setSelectedPayment(payment);

    if (!preserveState) {
      setStatusForm({
        paymentDone: currentCompletion?.paymentDone || false,
        odooEntryDone: currentCompletion?.odooEntryDone || false,
        attachmentsDone: currentCompletion?.attachmentsDone || false,
      });

      if (!odooReferenceNumber) {
        const currentOdooRef = currentCompletion?.odooReferenceNumber || "";
        setOdooReferenceNumber(currentOdooRef);
      }
    }

    setShowUpdateModal(true);
  };

  const openAttachmentModal = (payment) => {
    setSelectedPayment(payment);
    setShowAttachmentModal(true);
  };

  const handleUpload = async () => {
    if (!uploadForm.File) {
      toast.error("Please select a file to upload.");
      return;
    }

    let paymentCompletionId = selectedPayment.paymentCompletion?.id;

    if (!paymentCompletionId) {
      const currentPayment = dashboardData.approvedPayments.find(
        (p) => p.id === selectedPayment.id
      );
      paymentCompletionId = currentPayment?.paymentCompletion?.id;
    }

    if (!paymentCompletionId) {
      toast.error(
        "❌ Please update payment status first to create a completion record."
      );
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("File", uploadForm.File);
      formData.append("UploadedByUserId", user.id.toString());

      await API.post(
        `/PaymentCompletion/upload-attachment/${paymentCompletionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("✅ File uploaded successfully!");
      setShowAttachmentModal(false);
      setUploadForm({
        File: null,
        Description: "",
      });

      await fetchDashboardData();

      // Reopen update modal with preserved state
      setTimeout(() => {
        openUpdateModal(selectedPayment, true);
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        "❌ Upload failed: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setUploading(false);
    }
  };

  const getCompletionPercentage = (payment) => {
    if (!payment.paymentCompletion) return 0;

    const { paymentDone, odooEntryDone, attachmentsDone } =
      payment.paymentCompletion;
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

  const getStatusIcon = (isDone) => {
    return isDone ? "✅" : "❌";
  };

  const getFilteredPayments = () => {
    const approvedPayments = dashboardData.approvedPayments || [];
    const completionStatus = dashboardData.completionStatus || [];

    const inProgressPayments = approvedPayments.filter(
      (payment) => !payment.isFullyCompleted
    );

    const completedPayments = approvedPayments.filter(
      (payment) => payment.isFullyCompleted
    );

    return {
      inProgressPayments,
      completedPayments,
      completionStatus,
    };
  };

  const { inProgressPayments, completedPayments, completionStatus } =
    getFilteredPayments();

  const renderResubmissionInfo = (payment) => {
    if (!payment.isResubmitted) return null;

    return (
      <div className="payment-resubmission-info">
        <span className="payment-resubmitted-badge">🔄 Resubmitted</span>
        <div className="payment-resubmission-details">
          <div className="payment-detail-item">
            <span className="payment-detail-label">Approval Count:</span>
            <span className="payment-detail-value">
              {payment.approvalCount} time(s)
            </span>
          </div>
          {payment.latestApprovalDate && (
            <div className="payment-detail-item">
              <span className="payment-detail-label">Latest Approval:</span>
              <span className="payment-detail-value">
                {new Date(payment.latestApprovalDate).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResetBadge = (payment) => {
    if (payment.isResubmitted && !payment.isFullyCompleted) {
      return <span className="payment-reset-badge">🔄 Payment Reset</span>;
    }
    return null;
  };

  // Toggle card expansion
  const toggleCard = (paymentId) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const isCardExpanded = (paymentId) => {
    return expandedCards.has(paymentId);
  };

  const renderApprovedPaymentCard = (payment) => {
    const isExpanded = isCardExpanded(payment.id);
    const completionPercentage = getCompletionPercentage(payment);
    const currentCompletion = payment.paymentCompletion;

    // Get otherAmount from the correct data structure
    const getOtherAmount = () => {
      // Try different possible locations for otherAmount
      if (payment.allApprovals?.[0]?.otherAmount) {
        return payment.allApprovals[0].otherAmount;
      }
      if (payment.approvalHistory?.otherAmount) {
        return payment.approvalHistory.otherAmount;
      }
      if (payment.latestApproval?.otherAmount) {
        return payment.latestApproval.otherAmount;
      }
      return 0;
    };

    const otherAmount = getOtherAmount();

    return (
      <div key={payment.id} className="payment-card">
        <div
          className="payment-header payment-card-header-clickable"
          onClick={() => toggleCard(payment.id)}
        >
          <div className="payment-header-left">
            <div className="payment-title-section">
              <h3 className="payment-title">Request Transfer #{payment.id}</h3>
              {renderResubmissionInfo(payment)}
            </div>
            {!isExpanded && (
              <div className="payment-collapsed-info">
                <span className="payment-collapsed-vendor">
                  {payment.vendorName}
                </span>
                <span className="payment-collapsed-payment-due">
                  Payment Due: {payment.paymentDue || "N/A"}
                </span>
              </div>
            )}
            {isExpanded && (
              <p className="payment-meta">
                Prepared by: {payment.preparedBy} •{" "}
                {new Date(payment.preparedByCreatedDate).toLocaleDateString()} •{" "}
                From Branch: {payment.preparedByBranch}
              </p>
            )}
          </div>

          <div className="payment-status-section">
            <div
              className="payment-percentage-badge"
              style={{ background: getStatusColor(completionPercentage) }}
            >
              {completionPercentage}% Complete
            </div>
            {renderResetBadge(payment)}
            {payment.isFullyCompleted && (
              <span className="payment-completed-badge">
                ✅ Fully Completed
              </span>
            )}
            <span className="payment-toggle-icon">
              {isExpanded ? "▼" : "▶"}
            </span>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="payment-details-grid">
              <div>
                <h4 className="payment-section-title">Vendor Details</h4>
                <p>
                  <strong>Vendor:</strong> {payment.vendorName}
                </p>
                <p>
                  <strong>Bank:</strong> {payment.vendorBank}
                </p>
                <p>
                  <strong>Account:</strong> {payment.vendorBankAcc}
                </p>
                <p>
                  <strong>Branch:</strong> {payment.vendorBranch}
                </p>
              </div>

              <div>
                <h4 className="payment-section-title">Payment Details</h4>
                <p>
                  <strong>Adma Balance:</strong> SAR{" "}
                  {payment.balanceAsPerAdmaShamran}
                </p>
                <p>
                  <strong>Supplier Balance:</strong> SAR{" "}
                  {payment.balanceAsPerSupplier}
                </p>
                <p>
                  <strong>Difference:</strong> SAR {payment.difference}
                </p>
                <p>
                  <strong>Payment Due:</strong> {payment.paymentDue}
                </p>
                <p>
                  <strong>Reason for Difference:</strong>{" "}
                  {payment.reasonOFDifference}
                </p>
                {/* FIXED: Show otherAmount with proper formatting */}
                {otherAmount > 0 && (
                  <p>
                    <strong>Amount By Approver:</strong>{" "}
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      SAR {otherAmount.toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Rest of the component remains the same */}
            <div className="payment-completion-section">
              <h4 className="payment-section-title">Completion Status</h4>

              <div className="completion-steps-grid">
                {[
                  {
                    key: "paymentDone",
                    label: "Payment Processed",
                    date: currentCompletion?.paymentDoneDate,
                    isDone: currentCompletion?.paymentDone || false,
                  },
                  {
                    key: "odooEntryDone",
                    label: "Odoo Entry",
                    date: currentCompletion?.odooEntryDoneDate,
                    isDone: currentCompletion?.odooEntryDone || false,
                  },
                  {
                    key: "attachmentsDone",
                    label: "Attachments",
                    date: currentCompletion?.attachmentsDoneDate,
                    isDone: currentCompletion?.attachmentsDone || false,
                  },
                ].map((item) => (
                  <div key={item.key} className="completion-step">
                    <div
                      className={`completion-step-icon ${
                        item.isDone ? "completed" : "pending"
                      }`}
                    >
                      {item.isDone ? "✓" : "..."}
                    </div>
                    <div className="completion-step-label">{item.label}</div>
                    {item.isDone && item.date && (
                      <div className="completion-step-date">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    )}
                    {!item.isDone && (
                      <div className="completion-step-pending">Pending</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${completionPercentage}%`,
                    background: getStatusColor(completionPercentage),
                  }}
                />
              </div>

              <div className="completion-meta">
                <span>
                  Last updated:{" "}
                  {currentCompletion
                    ? new Date(
                        currentCompletion.lastUpdatedDate
                      ).toLocaleString()
                    : "Never"}
                </span>
                <span>By: {currentCompletion?.updatedBy || "N/A"}</span>
              </div>

              {currentCompletion?.Remarks && (
                <div className="completion-remarks">
                  <strong>Remarks:</strong> {currentCompletion.Remarks}
                </div>
              )}
            </div>

            {currentCompletion?.attachments &&
              currentCompletion.attachments.length > 0 && (
                <div className="attachments-section">
                  <h4 className="payment-section-title">Attachments</h4>
                  <div className="attachments-list">
                    {currentCompletion.attachments.map((attachment) => (
                      <div key={attachment.id} className="attachment-item">
                        <span className="attachment-icon">📎</span>
                        <span className="attachment-name">
                          {attachment.fileName}
                        </span>
                        <button
                          onClick={() => downloadAttachment(attachment.id)}
                          className="attachment-download-btn"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="attachment-remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="payment-action-buttons">
              <button
                onClick={() => openUpdateModal(payment)}
                className="payment-update-btn"
              >
                📝 Update Status
              </button>
              <button
                onClick={() => handleViewDetails(payment.id)}
                className="payment-details-btn"
              >
                🔍 View History
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCompletedPaymentCard = (payment) => {
    const isExpanded = isCardExpanded(payment.id);
    const completionPercentage = getCompletionPercentage(payment);
    const currentCompletion = payment.paymentCompletion;

    return (
      <div key={payment.id} className="payment-card completed">
        <div
          className="payment-header payment-card-header-clickable"
          onClick={() => toggleCard(payment.id)}
        >
          <div className="payment-header-left">
            <div className="payment-title-section">
              <h3 className="payment-title completed">
                ✅ Request Transfer #{payment.id}
              </h3>
              {renderResubmissionInfo(payment)}
            </div>
            {!isExpanded && (
              <div className="payment-collapsed-info">
                <span className="payment-collapsed-vendor">
                  {payment.vendorName}
                </span>
                <span className="payment-collapsed-payment-due">
                  Payment Due: {payment.paymentDue || "N/A"}
                </span>
              </div>
            )}
            {isExpanded && (
              <p className="payment-meta">
                Prepared by: {payment.preparedBy} •{" "}
                {new Date(payment.preparedByCreatedDate).toLocaleDateString()} •{" "}
                From Branch: {payment.preparedByBranch}
              </p>
            )}
          </div>

          <div className="payment-status-section">
            <div className="payment-percentage-badge completed">
              {completionPercentage}% Complete
            </div>
            <span className="payment-toggle-icon">
              {isExpanded ? "▼" : "▶"}
            </span>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="payment-details-grid">
              <div>
                <h4 className="payment-section-title">Vendor Details</h4>
                <p>
                  <strong>Vendor:</strong> {payment.vendorName}
                </p>
                <p>
                  <strong>Bank:</strong> {payment.vendorBank}
                </p>
                <p>
                  <strong>Account:</strong> {payment.vendorBankAcc}
                </p>
                <p>
                  <strong>Branch:</strong> {payment.vendorBranch}
                </p>
              </div>

              <div>
                <h4 className="payment-section-title">Payment Details</h4>
                <p>
                  <strong>Adma Balance:</strong> SAR{" "}
                  {payment.balanceAsPerAdmaShamran}
                </p>
                <p>
                  <strong>Supplier Balance:</strong> SAR{" "}
                  {payment.balanceAsPerSupplier}
                </p>
                <p>
                  <strong>Difference:</strong> SAR {payment.difference}
                </p>
                <p>
                  <strong>Payment Due:</strong> {payment.paymentDue}
                </p>
                <p>
                  <strong>Reason for Difference:</strong>{" "}
                  {payment.reasonOFDifference}
                </p>
              </div>
            </div>

            <div className="payment-completion-section completed">
              <h4 className="payment-section-title">
                ✅ Completion Status - All Tasks Completed
              </h4>

              <div className="completion-steps-grid">
                {[
                  {
                    key: "paymentDone",
                    label: "Payment Processed",
                    date: currentCompletion?.paymentDoneDate,
                    isDone: currentCompletion?.paymentDone || false,
                  },
                  {
                    key: "odooEntryDone",
                    label: "Odoo Entry",
                    date: currentCompletion?.odooEntryDoneDate,
                    isDone: currentCompletion?.odooEntryDone || false,
                  },
                  {
                    key: "attachmentsDone",
                    label: "Attachments",
                    date: currentCompletion?.attachmentsDoneDate,
                    isDone: currentCompletion?.attachmentsDone || false,
                  },
                ].map((item) => (
                  <div key={item.key} className="completion-step completed">
                    <div className="completion-step-icon completed">✓</div>
                    <div className="completion-step-label completed">
                      {item.label}
                    </div>
                    {item.date && (
                      <div className="completion-step-date completed">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {currentCompletion?.Remarks && (
                <div className="completion-remarks completed">
                  <strong>Remarks:</strong> {currentCompletion.Remarks}
                </div>
              )}
            </div>

            {currentCompletion?.attachments &&
              currentCompletion.attachments.length > 0 && (
                <div className="attachments-section">
                  <h4 className="payment-section-title">Attachments</h4>
                  <div className="attachments-list">
                    {currentCompletion.attachments.map((attachment) => (
                      <div key={attachment.id} className="attachment-item">
                        <span className="attachment-icon">📎</span>
                        <span className="attachment-name">
                          {attachment.fileName}
                        </span>
                        <button
                          onClick={() => downloadAttachment(attachment.id)}
                          className="attachment-download-btn"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="payment-action-buttons">
              <button
                onClick={() => handleViewDetails(payment.id)}
                className="payment-details-btn"
              >
                🔍 View History
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCompletionStatusCard = (status) => {
    const completion = status.paymentCompletion;
    const percentage = status.completionPercentage;

    return (
      <div key={status.id} className="completion-status-card">
        <div className="completion-status-header">
          <div>
            <h4>Entry #{status.id}</h4>
            <p className="completion-status-meta">
              {status.vendorName} • {status.preparedBy}
            </p>
            {status.isResubmitted && (
              <span className="completion-resubmitted-badge">
                🔄 Resubmitted
              </span>
            )}
          </div>
          <div className="completion-status-badges">
            <div
              className="completion-percentage-badge"
              style={{ background: getStatusColor(percentage) }}
            >
              {percentage}%
            </div>
            {status.isFullyCompleted && (
              <div className="completion-full-badge">Complete</div>
            )}
          </div>
        </div>

        <div className="completion-status-details">
          <span>Amount: SAR {status.amount}</span>
          <span>Bank: {status.vendorBank}</span>
        </div>

        <div className="completion-progress-container">
          <div
            className="completion-progress-bar"
            style={{
              width: `${percentage}%`,
              background: getStatusColor(percentage),
            }}
          />
        </div>

        <div className="completion-status-icons">
          <span>Payment: {getStatusIcon(completion?.paymentDone)}</span>
          <span>Odoo: {getStatusIcon(completion?.odooEntryDone)}</span>
          <span>Files: {getStatusIcon(completion?.attachmentsDone)}</span>
          <span>Attachments: {completion?.attachmentCount || 0}</span>
        </div>
      </div>
    );
  };

  if (loading)
    return <div className="payment-loading">Loading payment data...</div>;

  const stats = {
    approvedPayments: inProgressPayments.length,
    completedPayments: completedPayments.length,
    completionStatus: completionStatus.length,
    completed: completedPayments.length,
    inProgress: inProgressPayments.length,
  };

  return (
    <div className="payment-dashboard-container">
      <button className="goBack" onClick={backtodashboard}>
        ← Back to Dashboard
      </button>
      <button className="pay-logout-button" onClick={handleLogout}>
        🚪 Logout        
      </button>
      <h1>Payment Completion</h1>
      {/* <p>
        Welcome, {user?.username}! Track and manage payment completion status.
      </p> */}

      {/* FILTERS SECTION */}
      <div className="payment-filters-section">
        <h3>Filters</h3>
        <div className="payment-filters-grid">
          {/* Branch Filter */}
          <div className="payment-filter-group">
            <label className="payment-filter-label">Branch:</label>
            <select
              value={selectedBranch}
              onChange={handleBranchChange}
              className="payment-filter-input"
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
          <div className="payment-filter-group">
            <label className="payment-filter-label">From Date:</label>
            <input
              type="date"
              name="fromDate"
              value={dateFilter.fromDate}
              onChange={handleDateFilterChange}
              className="payment-filter-input"
            />
          </div>

          {/* Date To Filter */}
          <div className="payment-filter-group">
            <label className="payment-filter-label">To Date:</label>
            <input
              type="date"
              name="toDate"
              value={dateFilter.toDate}
              onChange={handleDateFilterChange}
              className="payment-filter-input"
            />
          </div>

          {/* Vendor Search Filter */}
          <div className="payment-filter-group">
            <label className="payment-filter-label">Search Vendor:</label>
            <input
              type="text"
              value={vendorSearch}
              onChange={handleVendorSearchChange}
              placeholder="Type vendor name to search..."
              className="payment-filter-input"
            />
          </div>

          {/* Filter Actions */}
          <div className="payment-filter-actions">
            <button
              className="payment-action-button payment-apply-button"
              onClick={applyFilters}
            >
              🔍 Apply Filters
            </button>
            <button
              className="payment-action-button payment-clear-button"
              onClick={clearFilters}
            >
              🗑️ Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* <div className="payment-stats-grid">
        <div className="payment-stat-card">
          <h3>In Progress</h3>
          <span className="payment-stat-value in-progress">
            {stats.approvedPayments}
          </span>
        </div>
        <div className="payment-stat-card">
          <h3>Completed</h3>
          <span className="payment-stat-value completed">
            {stats.completedPayments}
          </span>
        </div>
        <div className="payment-stat-card">
          <h3>Being Processed</h3>
          <span className="payment-stat-value processing">
            {stats.completionStatus}
          </span>
        </div>
        <div className="payment-stat-card">
          <h3>Total</h3>
          <span className="payment-stat-value total">
            {stats.approvedPayments + stats.completedPayments}
          </span>
        </div>
      </div> */}

      <div className="payment-tabs-container">
        <button
          className={`payment-tab ${
            activeTab === "approved-payments" ? "active" : ""
          }`}
          onClick={() => setActiveTab("approved-payments")}
        >
          In Progress ({stats.approvedPayments})
        </button>
        <button
          className={`payment-tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({stats.completedPayments})
        </button>
        <button
          className={`payment-tab ${
            activeTab === "completion-status" ? "active" : ""
          }`}
          onClick={() => setActiveTab("completion-status")}
        >
          Completion Status ({stats.completionStatus})
        </button>
      </div>

      <div className="payment-refresh-section">
        <button onClick={fetchDashboardData} className="payment-refresh-btn">
          🔄 Refresh Data
        </button>
      </div>

      <div className="payment-tab-content">
        {activeTab === "approved-payments" && (
          <div>
            <h2>In Progress Payments</h2>
            {inProgressPayments.length === 0 ? (
              <div className="payment-empty-state">
                <div className="payment-empty-icon">🎉</div>
                <h3>
                  {dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()
                    ? "No payments found with current filters"
                    : "All Payments Completed!"}
                </h3>
                <p>
                  {dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()
                    ? "Try clearing filters to see all payments"
                    : "All approved payments have been fully processed."}
                </p>
                {(dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()) && (
                  <button
                    className="payment-action-button payment-clear-button"
                    onClick={clearFilters}
                    style={{ marginTop: "10px" }}
                  >
                    🗑️ Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              inProgressPayments.map(renderApprovedPaymentCard)
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div>
            <h2>Completed Payments</h2>
            {completedPayments.length === 0 ? (
              <div className="payment-empty-state">
                <div className="payment-empty-icon">📋</div>
                <h3>
                  {dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()
                    ? "No completed payments found with current filters"
                    : "No Completed Payments"}
                </h3>
                <p>
                  {dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()
                    ? "Try clearing filters to see all completed payments"
                    : "No payments have been fully completed yet."}
                </p>
                {(dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()) && (
                  <button
                    className="payment-action-button payment-clear-button"
                    onClick={clearFilters}
                    style={{ marginTop: "10px" }}
                  >
                    🗑️ Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              completedPayments.map(renderCompletedPaymentCard)
            )}
          </div>
        )}

        {activeTab === "completion-status" && (
          <div>
            <h2>Payment Completion Status</h2>
            {completionStatus.length === 0 ? (
              <div className="payment-empty-state">
                <div className="payment-empty-icon">📊</div>
                <h3>
                  {dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()
                    ? "No completion data found with current filters"
                    : "No Completion Data"}
                </h3>
                <p>
                  {dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()
                    ? "Try clearing filters to see all completion data"
                    : "No payment completion data available."}
                </p>
                {(dateFilter.fromDate ||
                  dateFilter.toDate ||
                  selectedBranch !== "all" ||
                  vendorSearch.trim()) && (
                  <button
                    className="payment-action-button payment-clear-button"
                    onClick={clearFilters}
                    style={{ marginTop: "10px" }}
                  >
                    🗑️ Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="completion-status-grid">
                {completionStatus.map((status) => (
                  <div key={status.id}>
                    {renderCompletionStatusCard(status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showUpdateModal && (
        <UpdateStatusModal
          selectedPayment={selectedPayment}
          statusForm={statusForm}
          setStatusForm={setStatusForm}
          odooReferenceNumber={odooReferenceNumber}
          setOdooReferenceNumber={setOdooReferenceNumber}
          setShowUpdateModal={setShowUpdateModal}
          handleStatusUpdate={handleStatusUpdate}
          openAttachmentModal={openAttachmentModal}
        />
      )}

      {showAttachmentModal && (
        <AttachmentModal
          selectedPayment={selectedPayment}
          setShowAttachmentModal={setShowAttachmentModal}
          uploadForm={uploadForm}
          setUploadForm={setUploadForm}
          uploading={uploading}
          handleUpload={handleUpload}
          dashboardData={dashboardData}
          user={user}
        />
      )}

      {showDetailsModal && (
        <EnhancedDetailsModal
          selectedPayment={selectedPayment}
          setShowDetailsModal={setShowDetailsModal}
          downloadAttachment={downloadAttachment}
        />
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
}
