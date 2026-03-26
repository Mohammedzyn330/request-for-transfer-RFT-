import React, { useState } from "react";
import "./Approver.css";

export default function Approver() {
  const [approving, setApproving] = useState(""); // "approved" or "Rejeccted"
  const [approverName, setApproverName] = useState(""); // name of the person approving
  const [message, setMessage] = useState("");

  const handleVerificationChange = (e) => {
    const value = e.target.value;
    setApproving(value);
    setMessage(""); // clear previous message

    // If verified, set approver name automatically
    if (value === "approved") {
      setApproverName("Current User"); // replace with actual user name if available
    } else {
      setApproverName(""); // clear if not verified
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!approving) {
      alert("Please select Approved or Reject.");
      return;
    }

    if (approving === "Reject") {
      setMessage(
        "Your email has been sent to the Varifier to varify it again because of rejection."
      );
    } else {
      setMessage("Form approved successfully!");
    }
  };

  return (
    <div className="container">
      <form className="form-wrapper" onSubmit={handleSubmit}>
        <div className="header">
          <img src="/Adma-logo.png" alt="Adma Logo" />
          <div className="header-right">
            <h1>Request For Transfer</h1>
            <p>Date: 1/9/2025</p>
            <p>Doc #: Riy-2025-00024</p>
          </div>
        </div>

        <div className="form-section">
          <div className="grid">
            <div>
              <label>Supplier Name</label>
              <input type="text" value="List Contract" readOnly />
            </div>
            <div>
              <label>Bank Name</label>
              <input type="text" value="National Commercial Bank" readOnly />
            </div>
          </div>

          <div className="grid">
            <div>
              <label>Bank Account Number</label>
              <input type="text" value="SA2210000062213262000102" readOnly />
            </div>
            <div>
              <label>Branch Name</label>
              <input type="text" value="Riyadh" readOnly />
            </div>
          </div>
        </div>

        <h2 className="section-title">Statement of Account</h2>
        <table>
          <thead>
            <tr>
              <th>Balance As Per Adma Shamran</th>
              <th>Balance As Per Supplier</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>13,909.25</td>
              <td>27,818.50</td>
              <td>13,909.25</td>
            </tr>
          </tbody>
        </table>

        <div className="form-section">
          <label>Reason Of Difference</label>
          <input type="text" value="-" readOnly />

          <label>Payment Due (SAR)</label>
          <input type="text" value="-" readOnly />

          <label>Remarks</label>
          <input type="text" value="Request for transfer to Basma" readOnly />
        </div>

        <h2 className="section-title">Authorization</h2>
        <table>
          <thead>
            <tr>
              <th>Prepared By</th>
              <th>Verified By (Accounts Dept.)</th>
              <th>Approved By (Finance Manager)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{approverName}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="section-title">Approving</h2>
        <div className="form-section">
          <label>
            <input
              type="radio"
              name="approved"
              value="approved"
              checked={approving === "approved"}
              onChange={handleVerificationChange}
            />{" "}
            Approved
          </label>
          <label style={{ marginLeft: "20px" }}>
            <input
              type="radio"
              name="approving"
              value="Reject"
              checked={approving === "Reject"}
              onChange={handleVerificationChange}
            />{" "}
            Reject
          </label>
        </div>

        <button type="submit" className="submit-button">
          Submit
        </button>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}
