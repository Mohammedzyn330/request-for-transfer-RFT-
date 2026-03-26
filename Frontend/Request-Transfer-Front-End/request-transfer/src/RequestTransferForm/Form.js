import React, { useState, useEffect, useMemo } from "react";
import API from "../api";
import "./Form.css";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";

export default function Form({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendors, setVendors] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEntryId, setEditEntryId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [formData, setFormData] = useState({
    vendorId: "",
    priorityName: "",
    balanceAsPerAdmaShamran: "",
    balanceAsPerSupplier: "",
    reasonOFDifference: "",
    paymentDue: "",
    remarks: "",
    userCreatedDate: "", // CHANGED: Empty string instead of default date
  });

  const vendorOptions = vendors.map((v) => ({
    value: v.id.toString(),
    label: `${v.supplierName}`,
  }));

  const priorityOptions = priorities.map((p) => ({
    value: p.priorityName,
    label: p.priorityName,
  }));

  // Load vendors and priorities on mount
  useEffect(() => {
    fetchVendors();
    fetchPriorities();
  }, []);

  // Check edit mode after vendors and priorities are loaded
  useEffect(() => {
    if (
      vendors.length > 0 &&
      priorities.length > 0 &&
      location.state?.editData
    ) {
      checkEditMode();
    }
  }, [vendors, priorities, location.state]);

  // Difference is now calculated reactively using useMemo below
  // No need for useEffect since it updates automatically when balances change

  useEffect(() => {
    if (!formData.userCreatedDate) {
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, userCreatedDate: today }));
    }
  }, []);

  const fetchPriorities = async () => {
    try {
      const res = await API.get(`/Preparedby/available-priorities`);
      setPriorities(res.data);
    } catch (error) {
      console.error("Error fetching priorities:", error);
      toast.error("Failed to load priorities.");
    }
  };

  const checkEditMode = () => {
    if (location.state?.editData) {
      const { id, ...editData } = location.state.editData;
      setIsEditMode(true);
      setEditEntryId(id);

      // FIXED: Proper date formatting for edit mode
      const formatDateForInput = (dateString) => {
        if (!dateString) return ""; // CHANGED: Return empty string instead of today's date

        try {
          // If it's already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }

          // If it's a different format, parse it
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        } catch (error) {
          console.error("Error formatting date:", error);
          return ""; // CHANGED: Return empty string on error
        }
      };

      // Set form data with properly formatted date
      // Difference will be calculated automatically by useMemo when balances are set
      setFormData({
        ...editData,
        vendorId: editData.vendorId?.toString() || "",
        priorityName: editData.priorityName || "",
        userCreatedDate: formatDateForInput(editData.userCreatedDate), // FIXED: Proper date formatting
      });

      // Find and set selected vendor
      if (editData.vendorId) {
        const vendor = vendors.find(
          (v) => v.id === parseInt(editData.vendorId)
        );
        setSelectedVendor(vendor || null);
      }

      // Find and set selected priority
      if (editData.priorityName) {
        const priority = priorities.find(
          (p) => p.priorityName === editData.priorityName
        );
        setSelectedPriority(priority || null);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
    navigate("Auth");
  };

  const fetchVendors = async () => {
    try {
      const res = await API.get(`/Vendor/${user.id}`);
      setVendors(res.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log(`Changing ${name} to:`, value, "Type:", typeof value); // Enhanced debug log

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVendorChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";

    setFormData((prev) => ({
      ...prev,
      vendorId: value,
    }));

    const vendor = vendors.find((v) => v.id === parseInt(value));
    setSelectedVendor(vendor || null);
  };

  const handlePriorityChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";

    setFormData((prev) => ({
      ...prev,
      priorityName: value,
    }));

    const priority = priorities.find((p) => p.priorityName === value);
    setSelectedPriority(priority || null);
  };

  // Handle file selection with proper restrictions
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".jpg",
      ".jpeg",
      ".png",
    ];

    const validFiles = [];

    for (const file of files) {
      // Check file type using both MIME type and extension
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();

      if (
        !allowedTypes.includes(file.type) &&
        !allowedExtensions.includes(fileExtension)
      ) {
        toast.error(
          `❌ File type not allowed: ${file.name}. Please upload PDF, Word, Excel, or Image files.`
        );
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`❌ ${file.name} exceeds 10MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
      toast.info(
        `📎 ${validFiles.length} file(s) selected. They will be uploaded when you submit the form.`
      );
    }

    e.target.value = ""; // Clear file input
  };

  // Remove pending file
  const removePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files after entry is created/updated
  const uploadFiles = async (entryId) => {
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    try {
      for (const file of pendingFiles) {
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

      if (successCount > 0) {
        toast.success(`✅ ${successCount} file(s) uploaded successfully!`);
        setUploadedFiles((prev) => [...prev, ...pendingFiles]);
        setPendingFiles([]);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(
        `❌ Failed to upload some files. ${successCount}/${pendingFiles.length} uploaded.`
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate difference - FIXED for edit mode
  // Calculate difference reactively - recalculates when balances change
  // Uses absolute value to calculate from both sides
  const difference = useMemo(() => {
    const admaBalance = parseFloat(formData.balanceAsPerAdmaShamran || 0);
    const supplierBalance = parseFloat(formData.balanceAsPerSupplier || 0);

    // Calculate absolute difference from both sides
    const diff = Math.abs(supplierBalance - admaBalance);

    return diff.toFixed(2);
  }, [formData.balanceAsPerAdmaShamran, formData.balanceAsPerSupplier]);

  const isDifferenceNegativeOrZero = parseFloat(difference) <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("❌ User not logged in.");
      return;
    }

    if (!formData.vendorId) {
      toast.error("❌ Please select a vendor.");
      return;
    }

    if (!formData.priorityName) {
      toast.error("❌ Please select a priority.");
      return;
    }

    // Validate that date is selected - IMPORTANT: Ensure date is always set
    if (!formData.userCreatedDate) {
      toast.error("❌ Please select a date.");
      return;
    }

    // Validate file sizes and types before submission
    for (const file of pendingFiles) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          `❌ ${file.name} exceeds 10MB limit. Please remove it before submitting.`
        );
        return;
      }
    }

    try {
      const payload = {
        VendorId: parseInt(formData.vendorId),
        UserId: user.id,
        PriorityName: formData.priorityName,
        balanceAsPerAdmaShamran: parseFloat(formData.balanceAsPerAdmaShamran),
        balanceAsPerSupplier: parseFloat(formData.balanceAsPerSupplier),
        difference: parseFloat(difference), // Use the calculated difference
        reasonOFDifference: isDifferenceNegativeOrZero
          ? "No difference"
          : formData.reasonOFDifference,
        paymentDue: formData.paymentDue,
        remarks: formData.remarks,
        userCreatedDate:
          formData.userCreatedDate || location.state?.editData?.userCreatedDate, // FIXED: Fallback to original date
      };

      console.log("Submitting payload with date:", payload.userCreatedDate);

      if (isEditMode && editEntryId) {
        // UPDATE existing entry
        await API.put(`/Preparedby/update/${editEntryId}`, payload);

        // Upload any pending files
        if (pendingFiles.length > 0) {
          await uploadFiles(editEntryId);
        }

        toast.success("✅ Entry updated successfully!");
      } else {
        // CREATE new entry
        const response = await API.post("/Preparedby/entry", payload);
        const newEntryId = response.data.id;

        toast.success("✅ Entry submitted successfully!");

        // Upload files for new entry
        if (pendingFiles.length > 0) {
          await uploadFiles(newEntryId);
        }

        // Reset form
        setFormData({
          vendorId: "",
          priorityName: "",
          balanceAsPerAdmaShamran: "",
          balanceAsPerSupplier: "",
          reasonOFDifference: "",
          paymentDue: "",
          remarks: "",
          userCreatedDate: "", // CHANGED: Reset to empty string
        });
        setSelectedVendor(null);
        setSelectedPriority(null);
        setPendingFiles([]);
        setUploadedFiles([]);
      }

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate("/preparer-dashboard");
      }, 500);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data || "❌ Failed to submit entry.");
    }
  };

  // Check if form can be submitted
  const canSubmit =
    formData.vendorId &&
    formData.priorityName &&
    formData.balanceAsPerAdmaShamran &&
    formData.balanceAsPerSupplier &&
    formData.paymentDue &&
    formData.remarks &&
    formData.userCreatedDate; // CHANGED: Added date validation

  return (
    <div className="preparedby-page-container">
      {/* Header from Customer.js */}
      <div className="top-bar">
        <button
          onClick={() => navigate("/preparer-dashboard")}
          className="go-back-btn"
        >
          ← Back to Dashboard
        </button>
        <div className="top-header-center">
          <img src="/Adma-logo.png" alt="Logo" />
          <h1>Adma Shamran Trading & Catering Co.</h1>
        </div>
        <button className="cus-logout-button" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      <div className="preparedby-center-container">
        <div className="preparedby-form-wrapper">
          {/* Form Header */}
          <div className="preparedby-header">
            <div className="preparedby-header-center">
              <h1>
                {isEditMode
                  ? "✏️ Edit Transfer Request"
                  : "Request for Transfer"}
                {isEditMode && (
                  <span className="preparedby-edit-id">
                    (Editing Entry #{editEntryId})
                  </span>
                )}
              </h1>
              <p className="preparedby-date">
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="preparedby-grid">
              {/* Vendor Selection */}
              <div className="preparedby-form-group">
                <label className="preparedby-label">Select Vendor</label>
                <Select
                  name="vendorId"
                  options={vendorOptions}
                  value={
                    vendorOptions.find((v) => v.value === formData.vendorId) ||
                    null
                  }
                  onChange={handleVendorChange}
                  isDisabled={isEditMode}
                  placeholder="-- Choose Vendor --"
                  isClearable
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />

                {isEditMode && (
                  <small style={{ color: "#6c757d" }}>
                    Vendor cannot be changed in edit mode
                  </small>
                )}
              </div>

              {/* Priority Selection */}
              <div className="preparedby-form-group">
                <label className="preparedby-label">Select Priority</label>
                <Select
                  name="priorityName"
                  options={priorityOptions}
                  value={
                    priorityOptions.find(
                      (p) => p.value === formData.priorityName
                    ) || null
                  }
                  onChange={handlePriorityChange}
                  placeholder="-- Choose Priority --"
                  isClearable
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>

              {/* Vendor Bank Info - Only show for existing vendors */}
              {selectedVendor && (
                <>
                  <div className="preparedby-form-group">
                    <label className="preparedby-label">Bank Name</label>
                    <input
                      type="text"
                      className="preparedby-input"
                      value={selectedVendor?.bankName || ""}
                      readOnly
                    />
                  </div>

                  <div className="preparedby-form-group">
                    <label className="preparedby-label">Account Number</label>
                    <input
                      type="text"
                      className="preparedby-input"
                      value={selectedVendor?.bankAccount || ""}
                      readOnly
                    />
                  </div>

                  <div className="preparedby-form-group">
                    <label className="preparedby-label">Branch Name</label>
                    <input
                      type="text"
                      className="preparedby-input"
                      value={selectedVendor?.branchName || ""}
                      readOnly
                    />
                  </div>
                </>
              )}
            </div>

            {/* Statement of Account */}
            <h2 className="preparedby-section-title">Statement of Account</h2>
            <div className="preparedby-grid">
              <div className="preparedby-form-group">
                <label className="preparedby-label">
                  Balance As Per Adma Shamran
                </label>
                <input
                  type="number"
                  name="balanceAsPerAdmaShamran"
                  className="preparedby-input"
                  value={formData.balanceAsPerAdmaShamran}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div className="preparedby-form-group">
                <label className="preparedby-label">
                  Balance As Per Supplier
                </label>
                <input
                  type="number"
                  name="balanceAsPerSupplier"
                  className="preparedby-input"
                  value={formData.balanceAsPerSupplier}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div className="preparedby-form-group">
                <label className="preparedby-label">Difference</label>
                <input
                  type="text"
                  className="preparedby-input"
                  value={difference}
                  readOnly
                  style={{
                    color: isDifferenceNegativeOrZero ? "#28a745" : "#dc3545",
                    fontWeight: "bold",
                  }}
                />
                {isEditMode && (
                  <small
                    style={{
                      color: "#6c757d",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    Difference is automatically calculated
                  </small>
                )}
              </div>

              <div className="preparedby-form-group">
                <label className="preparedby-label">Payment Due</label>
                <input
                  type="text"
                  name="paymentDue"
                  className="preparedby-input"
                  value={formData.paymentDue}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Additional Info - Conditionally render Reason of Difference */}
            {!isDifferenceNegativeOrZero && (
              <div className="preparedby-form-group">
                <label className="preparedby-label">Reason of Difference</label>
                <textarea
                  name="reasonOFDifference"
                  className="preparedby-textarea"
                  value={formData.reasonOFDifference}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Enter reason for difference..."
                  required={!isDifferenceNegativeOrZero}
                />
              </div>
            )}

            {/* Show message when difference is <= 0 */}
            {isDifferenceNegativeOrZero && (
              <div className="preparedby-info-message">
                <p>✓ No difference detected.</p>
              </div>
            )}

            <div className="preparedby-form-group">
              <label className="preparedby-label">Remarks</label>
              <textarea
                name="remarks"
                className="preparedby-textarea"
                value={formData.remarks}
                onChange={handleChange}
                rows={2}
                placeholder="Enter remarks..."
                required
              />
            </div>

            {/* File Upload Section - FIXED with proper restrictions */}
            <div className="preparedby-form-group">
              <label className="preparedby-label">
                📎 Upload Supporting Documents {!isEditMode && "(Optional)"}
              </label>
              <div className="preparedby-file-upload-section">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="preparedby-file-input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  title="PDF, Word, Excel, Images (Max 10MB per file)"
                />
                <small className="preparedby-file-hint">
                  Supported formats: PDF, Word, Excel, Images (Max 10MB per
                  file)
                </small>

                {/* Show pending files */}
                {pendingFiles.length > 0 && (
                  <div className="preparedby-pending-files">
                    <p>📁 Files ready to upload ({pendingFiles.length}):</p>
                    <ul>
                      {pendingFiles.map((file, index) => (
                        <li key={index}>
                          <span>
                            {file.name} (
                            {(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                          <button
                            type="button"
                            className="preparedby-remove-file"
                            onClick={() => removePendingFile(index)}
                            title="Remove file"
                          >
                            ❌
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Show uploaded files in edit mode */}
                {isEditMode && location.state?.editData?.attachments && (
                  <div className="preparedby-uploaded-files">
                    <p>✅ Previously uploaded files:</p>
                    <ul>
                      {location.state.editData.attachments.map(
                        (file, index) => (
                          <li key={index}>{file.fileName}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {isUploading && (
                  <div className="preparedby-uploading">
                    ⏳ Uploading files...
                  </div>
                )}
              </div>
            </div>

            {/* Prepared By and Date in one row */}
            <div className="preparedby-grid">
              <div className="preparedby-form-group">
                <label className="preparedby-label">Prepared by</label>
                <div className="preparedby-user-name">
                  {user?.name || user?.username || "User"}
                </div>
              </div>

              <div className="preparedby-form-group">
                <label className="preparedby-label">Date</label>
                <input
                  type="date"
                  name="userCreatedDate"
                  className="preparedby-input"
                  value={formData.userCreatedDate || ""}
                  onChange={handleChange}
                  required
                  style={{ padding: "8px" }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="preparedby-submit-button"
              disabled={!canSubmit || isUploading}
            >
              {isUploading
                ? "⏳ Processing..."
                : isEditMode
                ? "📤 Save & Submit"
                : "Submit"}
            </button>
          </form>

          {/* Cancel Edit Button */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            {isEditMode && (
              <button
                type="button"
                className="preparedby-cancel-button"
                onClick={() => {
                  setIsEditMode(false);
                  setEditEntryId(null);
                  setFormData({
                    vendorId: "",
                    priorityName: "",
                    balanceAsPerAdmaShamran: "",
                    balanceAsPerSupplier: "",
                    reasonOFDifference: "",
                    paymentDue: "",
                    remarks: "",
                    userCreatedDate: "", // CHANGED: Reset to empty string
                  });
                  setSelectedVendor(null);
                  setSelectedPriority(null);
                  setPendingFiles([]);
                  setUploadedFiles([]);
                  navigate("/preparer-dashboard");
                }}
              >
                ❌ Cancel Edit
              </button>
            )}
          </div>

          <ToastContainer position="bottom-right" />
        </div>
      </div>
    </div>
  );
}
