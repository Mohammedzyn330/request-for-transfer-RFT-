import React, { useState, useEffect } from "react";
import API from "../api";
import "./Customer.css";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

export default function Customer({ user }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAmount, setCustomerAmount] = useState("");
  const [userSelectedDate, setUserSelectedDate] = useState("");
  const [message, setMessage] = useState("");

  // Popup & filter states
  const [showPopup, setShowPopup] = useState(false);
  const [entries, setEntries] = useState([]);
  const [filterType, setFilterType] = useState("today"); // Set default to "today"
  const [months, setMonths] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [loadingEntries, setLoadingEntries] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchCustomers = async () => {
      try {
        const res = await API.get(`/CustomerList/${user.id}`);
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
      }
    };

    fetchCustomers();
  }, [user]);

  // Fetch entries automatically when popup opens
  useEffect(() => {
    if (showPopup && user) {
      fetchEntries();
    }
  }, [showPopup]); // Fetch when popup opens

  const customerOptions = customers.map((c) => ({
    value: c.id.toString(),
    label: c.customerName,
  }));

  const filterOption = (option, inputValue) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase());

  const handleCustomerChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";
    const customer = customers.find((c) => c.id === parseInt(value));
    setSelectedCustomer(customer || null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
    navigate("Auth");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerAmount || !user || !userSelectedDate) {
      alert("Please enter amount, select a date, and ensure you're logged in.");
      return;
    }

    const finalCustomerId = selectedCustomer?.id;

    if (!finalCustomerId) {
      setMessage("❌ Please select a valid customer.");
      return;
    }

    try {
      const res = await API.post("/CustomerAmount/entries", {
        customerListId: finalCustomerId,
        userId: user?.id,
        amountOFCusotmers: parseFloat(customerAmount),
        userCreatedDate: new Date(userSelectedDate).toISOString(),
      });

      setMessage(
        res.data.message ||
          `✅ Successfully added ${selectedCustomer.customerName} - ${customerAmount} SAR on ${userSelectedDate}`
      );

      setCustomerAmount("");
      setSelectedCustomer(null);
      setUserSelectedDate("");
    } catch (error) {
      console.error("Error submitting customer entry:", error);
      setMessage(
        error.response?.data?.message || "❌ Submission failed. Try again."
      );
    }
  };

  // Fetch entries for popup
  const fetchEntries = async () => {
    if (!user) return;

    setLoadingEntries(true);

    try {
      const res = await API.get(`/CustomerAmount`, {
        params: {
          userId: user.id,
          filterType: filterType || "today", // Ensure today is default
          selectedDate: selectedDateFilter || null,
          months: months || null,
        },
      });

      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }

    setLoadingEntries(false);
  };

  // Reset filters when popup closes
  const handleClosePopup = () => {
    setShowPopup(false);
    // Reset filters to default for next time
    setFilterType("today");
    setMonths("");
    setSelectedDateFilter("");
  };

  return (
    <div className="customer-container">
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

      <div className="customer-form-wrapper">
        <div className="customer-header">
          <div className="customer-header-content">
            <h1>Expected payments from customer</h1>
            {/* <p>Enter customer amount details</p> */}
          </div>
        </div>

        {/* View Entries Button */}
        <button
          type="button"
          className="customer-view-entries-btn"
          onClick={() => setShowPopup(true)}
        >
          📄 View Customer Entries
        </button>

        <form onSubmit={handleSubmit}>
          <div className="customer-grid">
            <div className="customer-form-group">
              <label>Customer</label>
              <Select
                options={customerOptions}
                value={
                  selectedCustomer
                    ? {
                        value: selectedCustomer.id?.toString(),
                        label: selectedCustomer.customerName,
                      }
                    : null
                }
                onChange={handleCustomerChange}
                placeholder="Search or select customer..."
                isClearable
                filterOption={filterOption}
                classNamePrefix="react-select"
              />
            </div>

            <div className="customer-form-group">
              <label>Amount (SAR)</label>
              <input
                type="number"
                placeholder="Enter customer amount"
                value={customerAmount}
                onChange={(e) => setCustomerAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>

            <div className="customer-form-group">
              <label>Date</label>
              <input
                type="date"
                value={userSelectedDate}
                onChange={(e) => setUserSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <button className="customer-submit-button" type="submit">
            Submit
          </button>
        </form>

        {message && (
          <div
            className={
              message.includes("✅")
                ? "customer-error-message"
                : "customer-success-message"
            }
          >
            {message}
          </div>
        )}
      </div>

      {/* POPUP FOR ENTRIES */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="close-popup" onClick={handleClosePopup}>
              ✖
            </button>

            <h2>Customer Payment Entries</h2>

            <div className="filter-section">
              <select
                className="filter-select"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setMonths("");
                  setSelectedDateFilter("");
                }}
              >
                <option value="today">Today</option>
                <option value="future">Future (Months)</option>
                <option value="date">Specific Date</option>
              </select>

              {filterType === "future" && (
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Enter months 1–12"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                />
              )}

              {filterType === "date" && (
                <input
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                />
              )}

              <button className="apply-filter-btn" onClick={fetchEntries}>
                Apply Filter
              </button>
            </div>

            {loadingEntries ? (
              <p>Loading entries...</p>
            ) : (
              <>
                {/* <div className="entries-summary">
                  {filterType === "today" && "Today"}
                  {filterType === "future" && `Next ${months} months`}
                  {filterType === "date" && selectedDateFilter}
                </div> */}
                <table className="entries-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Branch</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length > 0 ? (
                      entries.map((e) => (
                        <tr key={e.id}>
                          <td>{e.id}</td>
                          <td>{e.customerName}</td>
                          <td>{e.customerBranch}</td>
                          <td>{e.amountOFCusotmers}</td>
                          <td>{e.userCreatedDate?.split("T")[0]}</td>
                          <td>{e.userName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">No entries found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
