import React, { useState, useEffect } from "react";
import API from "../api";
import "./report.css";
import { useNavigate } from "react-router-dom";

export default function ExpectedCashFlow({ user }) {
  const [customerReport, setCustomerReport] = useState([]);
  const [bankPositionReport, setBankPositionReport] = useState([]);
  const [bankFacilityReport, setBankFacilityReport] = useState([]);
  const [brandsReport, setBrandsReport] = useState([]);
  const [vendorReport, setVendorReport] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [showBrandTable, setShowBrandTable] = useState(false);
  const [showBranhTable, setBranchShowTable] = useState({});
  const [showFuturePopup, setShowFuturePopup] = useState(false); //for the show of popup for selection
  const [futureFilter, setFutureFilter] = useState("nextMonths");
  const [showVBranchTable, setVBranchShowTable] = useState({
    showAll: false,
    riyadh: false,
    dammam: false,
    madinah: false,
    jeddah: false,
    tabuk: false,
  });
  const [showBankFacilityTable, setShowBankFacilityTable] = useState(false);
  // const [selectedBranch, setSelectedBranch] = useState("all");
  const [showBranches, setShowBranches] = useState(false);
  const [filterType, setFilterType] = useState("today"); // CHANGED: Default to "today"
  const [selectedDate, setSelectedDate] = useState("");
  const [nextMonths, setNextMonths] = useState(1);
  // const [includeCurrentMonth, setIncludeCurrentMonth] = useState(true);
  const [tempNextMonths, setTempNextMonths] = useState(1);
  // const [tempIncludeCurrent, setTempIncludeCurrent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nevigate = useNavigate();

  // Fetch reports
  useEffect(() => {
    const fetchAllReports = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError("");

        const formattedDate = selectedDate
          ? new Date(selectedDate).toLocaleDateString("en-CA")
          : "";

        let customerQuery = `/CustomerAmount?userId=${user.id}&filterType=${filterType}`;
        let bankFacilityQuery = `/BankFacillity?userId=${user.id}&filterType=${filterType}`;
        let bankPositonQuery = `/BankPosition?userId=${user.id}&filterType=${filterType}`;
        let amountToPayQuery = `/Amounttopay?userId=${user.id}&filterType=${filterType}`;
        let vendorQuery = `/Preparedby?userId=${user.id}&filterType=${filterType}`;

        if (filterType === "date" && formattedDate) {
          customerQuery += `&selectedDate=${formattedDate}`;
          bankFacilityQuery += `&selectedDate=${formattedDate}`;
          amountToPayQuery += `&selectedDate=${formattedDate}`;
          vendorQuery += `&selectedDate=${formattedDate}`;
        }

        // if (filterType === "nextMonths" && nextMonths > 0) {
        //   const include = includeCurrentMonth ? "true" : "false";
        //   bankFacilityQuery += `&months=${nextMonths}&includeCurrentMonth=${include}`;
        // }

        const [
          customerRes,
          bankPositionRes,
          bankFacilityRes,
          brandsRes,
          vendorRes,
        ] = await Promise.all([
          API.get(customerQuery),
          API.get(bankPositonQuery),
          API.get(bankFacilityQuery),
          API.get(amountToPayQuery),
          API.get(vendorQuery),
        ]);

        setCustomerReport(customerRes.data);
        setBankPositionReport(bankPositionRes.data);
        setBankFacilityReport(bankFacilityRes.data);
        setBrandsReport(brandsRes.data);
        setVendorReport(vendorRes.data);
      } catch (err) {
        console.error("Error fetching reports", err);
        setError("Failed to load reports. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (filterType !== "date" || (filterType === "date" && selectedDate)) {
      fetchAllReports();
    }
  }, [filterType, selectedDate, nextMonths, user]);

  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleShowDateData = () => {
    if (selectedDate) setFilterType("date");
    else alert("Please select a date first.");
  };

  const formatCurrency = (amount) =>
    parseFloat(amount).toLocaleString("en-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatCurrencyRent = (rentAmount) =>
    parseFloat(rentAmount).toLocaleString("en-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const calculateTotal = (data, field) =>
    data.reduce((total, item) => total + parseFloat(item[field] || 0), 0);

  const backtodashboard = () => {
    // Get user role from prop first, then fallback to localStorage
    let userRole =
      user?.roleId || user?.RoleId || user?.role?.id || user?.role?.Id;

    // If role not found in prop, check localStorage
    if (!userRole) {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userRole =
            parsedUser?.roleId ||
            parsedUser?.RoleId ||
            parsedUser?.role?.id ||
            parsedUser?.role?.Id;
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }
    }

    // Navigate based on role
    if (userRole === 2) {
      // Verifier
      nevigate("/verifier");
    } else if (userRole === 3) {
      // Approver
      nevigate("/approver");
    } else {
      // Final fallback: default to approver
      nevigate("/approver");
    }
  };
  // Helper function to group data by entity and calculate monthly totals
  const groupDataByEntityAndMonth = (
    data,
    entityField,
    amountField,
    rentAmountField,
    dateField = "userCreatedDate"
  ) => {
    const grouped = {};

    data.forEach((item) => {
      const entity = item[entityField];
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const monthName = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      const amount = parseFloat(item[amountField] || 0);
      const rentAmount = parseFloat(item[rentAmountField] || 0);
      const remarks = item.textForMessage || ""; // ADDED: Capture remarks

      if (!grouped[entity]) {
        grouped[entity] = {
          details: {},
          totalAmount: 0,
          totalRent: 0,
          remarks: remarks, // ADDED: Store remarks
        };
      }

      if (!grouped[entity].details[monthKey]) {
        grouped[entity].details[monthKey] = {
          monthName,
          amount: 0,
          rentAmount: 0,
          remarks: remarks, // ADDED: Store remarks for each month
        };
      }

      grouped[entity].details[monthKey].amount += amount;
      grouped[entity].details[monthKey].rentAmount += rentAmount;
      grouped[entity].totalAmount += amount;
      grouped[entity].totalRent += rentAmount;

      // ADDED: Update remarks if not already set
      if (!grouped[entity].remarks && remarks) {
        grouped[entity].remarks = remarks;
      }
    });

    return grouped;
  };
  // Modified grouping function for composite keys
  const groupDataByBankAndSupplier = (
    data,
    bankField,
    supplierField,
    amountField,
    dateField = "userCreatedDate"
  ) => {
    const grouped = {};

    data.forEach((item) => {
      const bank = item[bankField];
      const supplier = item[supplierField];
      const compositeKey = `${bank}_${supplier}`; // Create unique key

      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const monthName = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      const amount = parseFloat(item[amountField] || 0);

      if (!grouped[compositeKey]) {
        grouped[compositeKey] = {
          bankName: bank,
          supplierName: supplier,
          bankAccount: item.bankAccount, // Store bank account
          details: {},
          totalAmount: 0,
        };
      }

      if (!grouped[compositeKey].details[monthKey]) {
        grouped[compositeKey].details[monthKey] = {
          monthName,
          amount: 0,
        };
      }

      grouped[compositeKey].details[monthKey].amount += amount;
      grouped[compositeKey].totalAmount += amount;
    });

    return grouped;
  };

  // Get all unique months from data
  const getAllMonths = (groupedData) => {
    const monthSet = new Set();
    Object.values(groupedData).forEach((entity) => {
      Object.keys(entity.details).forEach((monthKey) => {
        monthSet.add(monthKey);
      });
    });

    return Array.from(monthSet).sort();
  };

  // Branch filters
  const branchFilters = {
    riyadh: [
      "Adma Shamran Catering Company [R]",
      "Adma Shamran Catering Company",
      "Adma Shamran Trading Company [R]",
      "Adma Shamran Trading Company",
    ],
    dammam: [
      "Adma Shamran Catering Company [D]",
      "Adma Shamran Catering Company",
      "Adma Shamran Trading Company [D]",
      "Adma Shamran Trading Company",
    ],
    madinah: [
      "Adma Shamran Catering Company [M]",
      "Adma Shamran Catering Company",
    ],
    jeddah: [
      "Adma Shamran Catering Company [J]",
      "Adma Shamran Catering Company",
    ],
    tabuk: [
      "Adma Shamran Catering Company [T]",
      "Adma Shamran Catering Company",
      "Adma Shamran Trading Company [T]",
      "Adma Shamran Trading Company",
    ],
    qasim: ["Adma Shamran Trading Company [Q]", "Adma Shamran Trading Company"],
    hail: ["Adma Shamran Trading Company [H]", "Adma Shamran Trading Company"],
    all: [],
  };

  // const getFilteredCustomers = () => {
  //   if (selectedBranch === "all") return customerReport;
  //   return customerReport.filter((c) =>
  //     branchFilters[selectedBranch].includes(c.customerBranch)
  //   );
  // };

  // const getFilteredVendors = () => {
  //   if (selectedBranch === "all") return vendorReport;
  //   return vendorReport.filter((c) =>
  //     branchFilters[selectedBranch].includes(c.vendorBranch)
  //   );
  // };

  // const filteredCustomers = getFilteredCustomers();
  // const filteredVendors = getFilteredVendors();

  if (loading)
    return (
      <div className="report-loading">
        <div className="report-loading-spinner"></div>
        <p>Loading reports...</p>
      </div>
    );

  if (error)
    return (
      <div className="report-error">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="report-dashboard">
      <button className="gobackbt" onClick={backtodashboard}>
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div
        className="cashflow-header"
        style={{ textAlign: "center", marginBottom: "2rem" }}
      >
        <h1
          style={{ color: "#2c3e50", marginBottom: "0.5rem", fontSize: "2rem" }}
        >
          Expected Cash Flow Report
        </h1>
      </div>

      {/* Filters */}
      <div
        className="cashflow-filters"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          margin: "2rem 0",
          flexWrap: "wrap",
        }}
      >
        {/* TODAY FILTER - Now active by default */}
        <button
          className={`filter-btn ${filterType === "today" ? "active" : ""}`}
          onClick={() => setFilterType("today")}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "2px solid #007bff",
            backgroundColor: filterType === "today" ? "#007bff" : "#fff",
            color: filterType === "today" ? "#fff" : "#007bff",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Today's Data
        </button>

        {/* FUTURE CASH FLOW FILTER */}
        {/* === Future Cash Flow Button === */}
        <button
          className="filter-btn"
          onClick={() => setShowFuturePopup(true)}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "2px solid #28a745",
            backgroundColor: filterType === "future" ? "#28a745" : "#fff",
            color: filterType === "future" ? "#fff" : "#28a745",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Future Cash Flow
        </button>

        {/* === Future Cash Flow Popup === */}
        {showFuturePopup && (
          <div
            onMouseDown={() => setShowFuturePopup(false)} // use mouseDown (fix datepicker close issue)
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              onMouseDown={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "2rem",
                width: "400px",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                animation: "fadeIn 0.3s ease",
              }}
            >
              {/* Radio Buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="radio"
                    name="futureFilter"
                    value="nextMonths"
                    checked={futureFilter === "nextMonths"}
                    onChange={() => setFutureFilter("nextMonths")}
                  />
                  Next Months
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="radio"
                    name="futureFilter"
                    value="date"
                    checked={futureFilter === "date"}
                    onChange={() => setFutureFilter("date")}
                  />
                  Show by Date
                </label>
              </div>

              {/* Conditional Inputs */}
              {futureFilter === "nextMonths" && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <label style={{ fontWeight: "500" }}>
                    Months:
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={tempNextMonths}
                      onChange={(e) =>
                        setTempNextMonths(parseInt(e.target.value) || 1)
                      }
                      style={{
                        width: "60px",
                        marginLeft: "0.5rem",
                        padding: "0.25rem",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      setNextMonths(tempNextMonths);
                      setFilterType("nextMonths");
                      setShowFuturePopup(false);
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#17a2b8",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    Apply
                  </button>
                </div>
              )}

              {futureFilter === "date" && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <input
                    type="date"
                    min={new Date().toLocaleDateString("en-CA")}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)} // simpler change handler
                    style={{
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "2px solid #ffc107",
                      fontSize: "0.9rem",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (selectedDate) {
                        handleShowDateData(selectedDate); // pass selectedDate explicitly
                        setFilterType("date"); // correct type
                      }
                      setShowFuturePopup(false);
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#ffc107",
                      color: "#333",
                      border: "2px solid #ffc107",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                    }}
                  >
                    Show Date
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowFuturePopup(false)}
                style={{
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  fontWeight: "500",
                  cursor: "pointer",
                  marginTop: "1rem",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bank Position Report */}
      <section className="report-section">
        <div
          className="report-header"
          style={{
            position: "relative",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          onClick={() => setShowTable((prev) => !prev)}
        >
          <div>
            <h2
              className="report-title"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Bank Postions{" "}
              <span
                style={{
                  transform: showTable ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  fontSize: "1.2rem",
                }}
              >
                ▼
              </span>
              <span className="report-subtitle">Current Bank Balances</span>
            </h2>
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#ffffff",
              textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {formatCurrency(calculateTotal(bankPositionReport, "amount"))} SAR
          </div>
        </div>

        {showTable && (
          <div
            className="report-table-container"
            style={{
              marginTop: "1rem",
              animation: "fadeIn 0.4s ease",
              overflowX: "auto",
            }}
          >
            <table className="report-table">
              <thead className="report-table-header">
                <tr>
                  <th className="report-table-cell">Bank Name</th>
                  <th className="report-table-cell">Bank Account</th>
                  <th className="report-table-cell">Amount (SAR)</th>
                </tr>
              </thead>
              <tbody className="report-table-body">
                {bankPositionReport.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="report-table-cell report-table-cell--empty"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  <>
                    {bankPositionReport.map((item) => (
                      <tr key={item.Id} className="report-table-row">
                        <td className="report-table-cell">{item.bankName}</td>
                        <td className="report-table-cell">
                          {item.bankAccount}
                        </td>
                        <td className="report-table-cell report-table-cell--number">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="report-table-row report-table-row--total">
                      <td
                        colSpan="2"
                        className="report-table-cell report-table-cell--total"
                      >
                        Total Balance
                      </td>
                      <td className="report-table-cell report-table-cell--number report-table-cell--total">
                        {formatCurrency(
                          calculateTotal(bankPositionReport, "amount")
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Customer Reports */}
      <section className="report-section">
        <div
          className="report-header"
          style={{
            position: "relative",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          onClick={() => setShowBranches((prev) => !prev)}
        >
          <div>
            <h2
              className="report-title"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Customer Payments{" "}
              <span
                style={{
                  transform: showBranches ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  fontSize: "1.2rem",
                }}
              >
                ▼
              </span>
              <span className="report-subtitle">
                Expected Customer Payments by Branch
              </span>
            </h2>
          </div>

          {/* ✅ Fixed top-right total (only visible months) */}
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#ffffff",
              textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {(() => {
              const groupedData = groupDataByEntityAndMonth(
                customerReport,
                "customerName",
                "amountOFCusotmers"
              );
              const allMonths = getAllMonths(groupedData).slice(0, nextMonths);

              const visibleMonthTotal = Object.values(groupedData).reduce(
                (sum, entity) =>
                  sum +
                  allMonths.reduce(
                    (monthSum, monthKey) =>
                      monthSum + (entity.details[monthKey]?.amount || 0),
                    0
                  ),
                0
              );

              return formatCurrency(visibleMonthTotal);
            })()}{" "}
            SAR
          </div>
        </div>

        {showBranches && (
          <div
            className="branch-summary"
            style={{
              margin: "1rem 0",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              animation: "fadeIn 0.4s ease",
            }}
          >
            {Object.keys(branchFilters)
              .filter((b) => b !== "all")
              .map((branch) => {
                const customers = customerReport.filter((c) =>
                  branchFilters[branch].includes(c.customerBranch)
                );

                return (
                  <div key={branch}>
                    <div
                      className="branch-summary-item"
                      style={{
                        background: "#f8f9fa",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        fontWeight: "500",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onClick={() =>
                        setBranchShowTable((prev) => ({
                          ...prev,
                          [branch]: !prev[branch],
                        }))
                      }
                    >
                      <span style={{ textTransform: "capitalize" }}>
                        {branch}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <span
                          style={{
                            transform: showBranhTable[branch]
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: "transform 0.3s ease",
                            fontSize: "1.2rem",
                          }}
                        >
                          ▼
                        </span>
                        <span>
                          Total:{" "}
                          {formatCurrency(
                            (() => {
                              const groupedData = groupDataByEntityAndMonth(
                                customers,
                                "customerName",
                                "amountOFCusotmers"
                              );
                              const allMonths = getAllMonths(groupedData).slice(
                                0,
                                nextMonths
                              );
                              return Object.values(groupedData).reduce(
                                (sum, entity) =>
                                  sum +
                                  allMonths.reduce(
                                    (monthSum, monthKey) =>
                                      monthSum +
                                      (entity.details[monthKey]?.amount || 0),
                                    0
                                  ),
                                0
                              );
                            })()
                          )}{" "}
                          SAR
                        </span>
                      </div>
                    </div>

                    {/* MONTH LAYOUT FOR BRANCH WITH VISIBLE MONTHS TOTALS */}
                    {showBranhTable[branch] && (
                      <div
                        className="report-table-container"
                        style={{ marginTop: "1rem", overflowX: "auto" }}
                      >
                        {(() => {
                          const groupedData = groupDataByEntityAndMonth(
                            customers,
                            "customerName",
                            "amountOFCusotmers"
                          );
                          const allMonths = getAllMonths(groupedData).slice(
                            0,
                            nextMonths
                          );

                          return (
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "0.85rem",
                              }}
                            >
                              <thead
                                style={{
                                  backgroundColor: "#f8f9fa",
                                  borderBottom: "2px solid #dee2e6",
                                }}
                              >
                                <tr>
                                  <th
                                    style={{
                                      padding: "0.75rem",
                                      textAlign: "left",
                                      fontWeight: "600",
                                      color: "#2c3e50",
                                      border: "1px solid #dee2e6",
                                    }}
                                  >
                                    Customer Name
                                  </th>
                                  {allMonths.map((monthKey) => (
                                    <th
                                      key={monthKey}
                                      style={{
                                        padding: "0.75rem",
                                        textAlign: "center",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        border: "1px solid #dee2e6",
                                        minWidth: "100px",
                                      }}
                                    >
                                      {monthKey}
                                    </th>
                                  ))}
                                  <th
                                    style={{
                                      padding: "0.75rem",
                                      textAlign: "center",
                                      fontWeight: "600",
                                      color: "#2c3e50",
                                      border: "1px solid #dee2e6",
                                    }}
                                  >
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(groupedData).length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={allMonths.length + 2}
                                      style={{
                                        padding: "2rem",
                                        textAlign: "center",
                                        color: "#7f8c8d",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      No customer records found
                                    </td>
                                  </tr>
                                ) : (
                                  <>
                                    {Object.entries(groupedData).map(
                                      ([customerName, data]) => {
                                        // ✅ Per-customer total only for visible months
                                        const customerVisibleTotal =
                                          allMonths.reduce(
                                            (sum, monthKey) =>
                                              sum +
                                              (data.details[monthKey]?.amount ||
                                                0),
                                            0
                                          );

                                        return (
                                          <tr key={customerName}>
                                            <td
                                              style={{
                                                padding: "0.75rem",
                                                fontWeight: "500",
                                                color: "#2c3e50",
                                                border: "1px solid #dee2e6",
                                              }}
                                            >
                                              {customerName}
                                            </td>
                                            {allMonths.map((monthKey) => (
                                              <td
                                                key={monthKey}
                                                style={{
                                                  padding: "0.75rem",
                                                  textAlign: "center",
                                                  border: "1px solid #dee2e6",
                                                  color: data.details[monthKey]
                                                    ? "#27ae60"
                                                    : "#bdc3c7",
                                                  fontWeight: data.details[
                                                    monthKey
                                                  ]
                                                    ? "500"
                                                    : "400",
                                                }}
                                              >
                                                {data.details[monthKey]
                                                  ? formatCurrency(
                                                      data.details[monthKey]
                                                        .amount
                                                    )
                                                  : "-"}
                                              </td>
                                            ))}
                                            <td
                                              style={{
                                                padding: "0.75rem",
                                                textAlign: "center",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                                border: "1px solid #dee2e6",
                                                backgroundColor: "#f8f9fa",
                                              }}
                                            >
                                              {formatCurrency(
                                                customerVisibleTotal
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      }
                                    )}

                                    {/* ✅ GRAND TOTAL (only visible months) */}
                                    <tr
                                      style={{
                                        backgroundColor: "#2c3e50",
                                        color: "white",
                                        fontWeight: "600",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "0.75rem",
                                          border: "1px solid #34495e",
                                        }}
                                      >
                                        GRAND TOTAL
                                      </td>
                                      {allMonths.map((monthKey) => {
                                        const monthTotal = Object.values(
                                          groupedData
                                        ).reduce(
                                          (sum, entity) =>
                                            sum +
                                            (entity.details[monthKey]?.amount ||
                                              0),
                                          0
                                        );
                                        return (
                                          <td
                                            key={monthKey}
                                            style={{
                                              padding: "0.75rem",
                                              textAlign: "center",
                                              border: "1px solid #34495e",
                                            }}
                                          >
                                            {monthTotal > 0
                                              ? formatCurrency(monthTotal)
                                              : "-"}
                                          </td>
                                        );
                                      })}
                                      <td
                                        style={{
                                          padding: "0.75rem",
                                          textAlign: "center",
                                          border: "1px solid #34495e",
                                        }}
                                      >
                                        {formatCurrency(
                                          Object.values(groupedData).reduce(
                                            (sum, entity) =>
                                              sum +
                                              allMonths.reduce(
                                                (mSum, monthKey) =>
                                                  mSum +
                                                  (entity.details[monthKey]
                                                    ?.amount || 0),
                                                0
                                              ),
                                            0
                                          )
                                        )}
                                      </td>
                                    </tr>
                                  </>
                                )}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Vendor Reports */}
      <section className="report-section">
        <div
          className="report-header"
          style={{
            position: "relative",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          onClick={() =>
            setVBranchShowTable((prev) => ({
              ...prev,
              showAll: !prev.showAll,
            }))
          }
        >
          <div>
            <h2
              className="report-title"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Vendor Payments{" "}
              <span
                style={{
                  transform: showVBranchTable.showAll
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  fontSize: "1.2rem",
                }}
              >
                ▼
              </span>
              <span className="report-subtitle">Vendor Payments by Branch</span>
            </h2>
          </div>

          {/* ✅ Fixed top-right total (only visible months) */}
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#ffffff",
              textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {(() => {
              const groupedData = groupDataByEntityAndMonth(
                vendorReport,
                "vendorName",
                "paymentDue"
              );
              const allMonths = getAllMonths(groupedData).slice(0, nextMonths);

              const visibleMonthTotal = Object.values(groupedData).reduce(
                (sum, entity) =>
                  sum +
                  allMonths.reduce(
                    (monthSum, monthKey) =>
                      monthSum + (entity.details[monthKey]?.amount || 0),
                    0
                  ),
                0
              );

              return formatCurrency(visibleMonthTotal);
            })()}{" "}
            SAR
          </div>
        </div>

        {/* Branch Summary */}
        {showVBranchTable.showAll && (
          <div
            className="branch-summary"
            style={{
              margin: "1rem 0",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              animation: "fadeIn 0.4s ease",
            }}
          >
            {Object.keys(branchFilters)
              .filter((b) => b !== "all")
              .map((branch) => {
                const vendors = vendorReport.filter((c) =>
                  branchFilters[branch].includes(c.vendorBranch)
                );

                return (
                  <div key={branch}>
                    <div
                      className="branch-summary-item"
                      style={{
                        background: "#f8f9fa",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        fontWeight: "500",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onClick={() =>
                        setVBranchShowTable((prev) => ({
                          ...prev,
                          [branch]: !prev[branch],
                        }))
                      }
                    >
                      <span style={{ textTransform: "capitalize" }}>
                        {branch}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <span
                          style={{
                            transform: showVBranchTable[branch]
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: "transform 0.3s ease",
                            fontSize: "1.2rem",
                          }}
                        >
                          ▼
                        </span>
                        <span>
                          Total:{" "}
                          {formatCurrency(
                            (() => {
                              const groupedData = groupDataByEntityAndMonth(
                                vendors,
                                "vendorName",
                                "paymentDue"
                              );
                              const allMonths = getAllMonths(groupedData).slice(
                                0,
                                nextMonths
                              );

                              return Object.values(groupedData).reduce(
                                (sum, entity) =>
                                  sum +
                                  allMonths.reduce(
                                    (monthSum, monthKey) =>
                                      monthSum +
                                      (entity.details[monthKey]?.amount || 0),
                                    0
                                  ),
                                0
                              );
                            })()
                          )}{" "}
                          SAR
                        </span>
                      </div>
                    </div>

                    {/* MONTH LAYOUT FOR BRANCH WITH VISIBLE MONTHS TOTALS */}
                    {showVBranchTable[branch] && (
                      <div
                        className="report-table-container"
                        style={{ marginTop: "1rem", overflowX: "auto" }}
                      >
                        {(() => {
                          const groupedData = groupDataByEntityAndMonth(
                            vendors,
                            "vendorName",
                            "paymentDue"
                          );
                          const allMonths = getAllMonths(groupedData).slice(
                            0,
                            nextMonths
                          );

                          return (
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "0.85rem",
                              }}
                            >
                              <thead
                                style={{
                                  backgroundColor: "#f8f9fa",
                                  borderBottom: "2px solid #dee2e6",
                                }}
                              >
                                <tr>
                                  <th
                                    style={{
                                      padding: "0.75rem",
                                      textAlign: "left",
                                      fontWeight: "600",
                                      color: "#2c3e50",
                                      border: "1px solid #dee2e6",
                                    }}
                                  >
                                    Vendor Name
                                  </th>
                                  {allMonths.map((monthKey) => (
                                    <th
                                      key={monthKey}
                                      style={{
                                        padding: "0.75rem",
                                        textAlign: "center",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        border: "1px solid #dee2e6",
                                        minWidth: "100px",
                                      }}
                                    >
                                      {monthKey}
                                    </th>
                                  ))}
                                  <th
                                    style={{
                                      padding: "0.75rem",
                                      textAlign: "center",
                                      fontWeight: "600",
                                      color: "#2c3e50",
                                      border: "1px solid #dee2e6",
                                    }}
                                  >
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(groupedData).length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={allMonths.length + 2}
                                      style={{
                                        padding: "2rem",
                                        textAlign: "center",
                                        color: "#7f8c8d",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      No vendor records found
                                    </td>
                                  </tr>
                                ) : (
                                  <>
                                    {Object.entries(groupedData).map(
                                      ([vendorName, data]) => {
                                        // ✅ Per-vendor total only for visible months
                                        const vendorVisibleTotal =
                                          allMonths.reduce(
                                            (sum, monthKey) =>
                                              sum +
                                              (data.details[monthKey]?.amount ||
                                                0),
                                            0
                                          );

                                        return (
                                          <tr key={vendorName}>
                                            <td
                                              style={{
                                                padding: "0.75rem",
                                                fontWeight: "500",
                                                color: "#2c3e50",
                                                border: "1px solid #dee2e6",
                                              }}
                                            >
                                              {vendorName}
                                            </td>
                                            {allMonths.map((monthKey) => (
                                              <td
                                                key={monthKey}
                                                style={{
                                                  padding: "0.75rem",
                                                  textAlign: "center",
                                                  border: "1px solid #dee2e6",
                                                  color: data.details[monthKey]
                                                    ? "#e74c3c"
                                                    : "#bdc3c7",
                                                  fontWeight: data.details[
                                                    monthKey
                                                  ]
                                                    ? "500"
                                                    : "400",
                                                }}
                                              >
                                                {data.details[monthKey]
                                                  ? formatCurrency(
                                                      data.details[monthKey]
                                                        .amount
                                                    )
                                                  : "-"}
                                              </td>
                                            ))}
                                            <td
                                              style={{
                                                padding: "0.75rem",
                                                textAlign: "center",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                                border: "1px solid #dee2e6",
                                                backgroundColor: "#f8f9fa",
                                              }}
                                            >
                                              {formatCurrency(
                                                vendorVisibleTotal
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      }
                                    )}

                                    {/* ✅ GRAND TOTAL (only visible months) */}
                                    <tr
                                      style={{
                                        backgroundColor: "#2c3e50",
                                        color: "white",
                                        fontWeight: "600",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "0.75rem",
                                          border: "1px solid #34495e",
                                        }}
                                      >
                                        GRAND TOTAL
                                      </td>
                                      {allMonths.map((monthKey) => {
                                        const monthTotal = Object.values(
                                          groupedData
                                        ).reduce(
                                          (sum, entity) =>
                                            sum +
                                            (entity.details[monthKey]?.amount ||
                                              0),
                                          0
                                        );
                                        return (
                                          <td
                                            key={monthKey}
                                            style={{
                                              padding: "0.75rem",
                                              textAlign: "center",
                                              border: "1px solid #34495e",
                                            }}
                                          >
                                            {monthTotal > 0
                                              ? formatCurrency(monthTotal)
                                              : "-"}
                                          </td>
                                        );
                                      })}
                                      <td
                                        style={{
                                          padding: "0.75rem",
                                          textAlign: "center",
                                          border: "1px solid #34495e",
                                        }}
                                      >
                                        {formatCurrency(
                                          Object.values(groupedData).reduce(
                                            (sum, entity) =>
                                              sum +
                                              allMonths.reduce(
                                                (mSum, monthKey) =>
                                                  mSum +
                                                  (entity.details[monthKey]
                                                    ?.amount || 0),
                                                0
                                              ),
                                            0
                                          )
                                        )}
                                      </td>
                                    </tr>
                                  </>
                                )}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Bank Facility Report */}
      {/* Bank Facility Report */}
      <section className="report-section">
        {(() => {
          const groupedData = groupDataByBankAndSupplier(
            bankFacilityReport,
            "bankName",
            "supplierName",
            "amountOFFacillities"
          );
          const allMonths = Array.from(
            new Set(
              Object.values(groupedData).flatMap((entity) =>
                Object.keys(entity.details)
              )
            )
          )
            .sort()
            .slice(0, nextMonths);

          // Calculate total
          const visibleMonthTotal = Object.values(groupedData).reduce(
            (sum, entity) =>
              sum +
              allMonths.reduce(
                (monthSum, monthKey) =>
                  monthSum + (entity.details[monthKey]?.amount || 0),
                0
              ),
            0
          );

          return (
            <>
              {/* Header */}
              <div
                className="report-header"
                style={{
                  position: "relative",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onClick={() => setShowBankFacilityTable((prev) => !prev)}
              >
                <div>
                  <h2
                    className="report-title"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    Bank Facility{" "}
                    <span
                      style={{
                        transform: showBankFacilityTable
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                        fontSize: "1.2rem",
                      }}
                    >
                      ▼
                    </span>
                    <span className="report-subtitle">
                      Bank Facility Payments by Supplier
                    </span>
                  </h2>
                </div>

                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
                  }}
                >
                  {formatCurrency(visibleMonthTotal)} SAR
                </div>
              </div>

              {/* Table */}
              {showBankFacilityTable && (
                <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.85rem",
                    }}
                  >
                    <thead
                      style={{
                        backgroundColor: "#f8f9fa",
                        borderBottom: "2px solid #dee2e6",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#2c3e50",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          Bank Name
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#2c3e50",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          Bank Account
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#2c3e50",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          Supplier Name
                        </th>
                        {allMonths.map((monthKey) => (
                          <th
                            key={monthKey}
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              fontWeight: "600",
                              color: "#2c3e50",
                              border: "1px solid #dee2e6",
                              minWidth: "100px",
                            }}
                          >
                            {monthKey}
                          </th>
                        ))}
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#2c3e50",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {Object.keys(groupedData).length === 0 ? (
                        <tr>
                          <td
                            colSpan={allMonths.length + 4}
                            style={{
                              padding: "2rem",
                              textAlign: "center",
                              color: "#7f8c8d",
                              fontStyle: "italic",
                            }}
                          >
                            No bank facility records found
                          </td>
                        </tr>
                      ) : (
                        <>
                          {Object.values(groupedData).map((entity) => {
                            const entityVisibleTotal = allMonths.reduce(
                              (sum, monthKey) =>
                                sum + (entity.details[monthKey]?.amount || 0),
                              0
                            );

                            return (
                              <tr
                                key={`${entity.bankName}_${entity.supplierName}`}
                              >
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "500",
                                    color: "#2c3e50",
                                    border: "1px solid #dee2e6",
                                  }}
                                >
                                  {entity.bankName}
                                </td>
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    color: "#7f8c8d",
                                    border: "1px solid #dee2e6",
                                  }}
                                >
                                  {entity.bankAccount}
                                </td>
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "500",
                                    color: "#2c3e50",
                                    border: "1px solid #dee2e6",
                                  }}
                                >
                                  {entity.supplierName}
                                </td>
                                {allMonths.map((monthKey) => (
                                  <td
                                    key={monthKey}
                                    style={{
                                      padding: "0.75rem",
                                      textAlign: "center",
                                      border: "1px solid #dee2e6",
                                      color: entity.details[monthKey]
                                        ? "#f39c12"
                                        : "#bdc3c7",
                                      fontWeight: entity.details[monthKey]
                                        ? "500"
                                        : "400",
                                    }}
                                  >
                                    {entity.details[monthKey]
                                      ? formatCurrency(
                                          entity.details[monthKey].amount
                                        )
                                      : "-"}
                                  </td>
                                ))}
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    border: "1px solid #dee2e6",
                                    backgroundColor: "#f8f9fa",
                                  }}
                                >
                                  {formatCurrency(entityVisibleTotal)}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Grand Total Row */}
                          <tr
                            style={{
                              backgroundColor: "#2c3e50",
                              color: "white",
                              fontWeight: "600",
                            }}
                          >
                            <td
                              colSpan="3"
                              style={{
                                padding: "0.75rem",
                                border: "1px solid #34495e",
                              }}
                            >
                              GRAND TOTAL
                            </td>
                            {allMonths.map((monthKey) => {
                              const monthTotal = Object.values(
                                groupedData
                              ).reduce(
                                (sum, entity) =>
                                  sum + (entity.details[monthKey]?.amount || 0),
                                0
                              );
                              return (
                                <td
                                  key={monthKey}
                                  style={{
                                    padding: "0.75rem",
                                    textAlign: "center",
                                    border: "1px solid #34495e",
                                  }}
                                >
                                  {monthTotal > 0
                                    ? formatCurrency(monthTotal)
                                    : "-"}
                                </td>
                              );
                            })}
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "center",
                                border: "1px solid #34495e",
                              }}
                            >
                              {formatCurrency(visibleMonthTotal)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* Brands Reports */}
      <section className="report-section">
        <div
          className="report-header"
          style={{
            position: "relative",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          onClick={() => setShowBrandTable((prev) => !prev)}
        >
          <div>
            <h2
              className="report-title"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Request Payments{" "}
              <span
                style={{
                  transform: showBrandTable ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  fontSize: "1.2rem",
                }}
              >
                ▼
              </span>
              <span className="report-subtitle">Schedule Brand Payments</span>
            </h2>
          </div>

          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#ffffff",
              textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {(() => {
              const groupedData = groupDataByEntityAndMonth(
                brandsReport,
                "brandName",
                "amountTOPay",
                "rentPaymentsAmount"
              );

              const allMonths = getAllMonths(groupedData).slice(0, nextMonths);

              const visibleMonthTotal = Object.values(groupedData).reduce(
                (sum, entity) =>
                  sum +
                  allMonths.reduce(
                    (monthSum, monthKey) =>
                      monthSum + (entity.details[monthKey]?.amount || 0),
                    0
                  ),
                0
              );

              const rentTotal = Object.values(groupedData).reduce(
                (sum, entity) =>
                  sum +
                  allMonths.reduce(
                    (monthSum, monthKey) =>
                      monthSum + (entity.details[monthKey]?.rentAmount || 0),
                    0
                  ),
                0
              );

              return (
                <>
                  <div>Amount: {formatCurrency(visibleMonthTotal)} SAR</div>
                  <div>Rent: {formatCurrencyRent(rentTotal)} SAR</div>
                </>
              );
            })()}
          </div>
        </div>
        {showBrandTable && (
          <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
            {(() => {
              // Separate RentPayments and regular brands
              const rentPaymentsData = brandsReport.filter(
                (item) => item.brandName === "RentPayments"
              );
              const otherBrandsData = brandsReport.filter(
                (item) => item.brandName !== "RentPayments"
              );

              console.log("Rent payments count:", rentPaymentsData.length);
              console.log("Other brands count:", otherBrandsData.length);

              // TRY DIFFERENT FIELD NAME COMBINATIONS HERE
              const groupedData = groupDataByEntityAndMonth(
                otherBrandsData,
                "brandName",
                "amountTOPay",
                ""
              );

              const groupedRentData = groupDataByEntityAndMonth(
                rentPaymentsData,
                "brandName",
                "",
                "rentPaymentsAmount"
              );

              const allMonths = getAllMonths(groupedData).slice(0, nextMonths);
              const rentMonths = getAllMonths(groupedRentData).slice(
                0,
                nextMonths
              );

              // Helper to render any table
              const renderTable = (data, months, title) => (
                <>
                  <h3
                    style={{
                      marginBottom: "0.5rem",
                      color: "#2c3e50",
                      fontWeight: "700",
                      fontSize: "1.1rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {title}
                  </h3>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.85rem",
                      marginBottom: "2rem",
                    }}
                  >
                    <thead
                      style={{
                        backgroundColor: "#f8f9fa",
                        borderBottom: "2px solid #dee2e6",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#2c3e50",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          Brand Name
                        </th>
                        {months.map((monthKey) => (
                          <th
                            key={monthKey}
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              fontWeight: "600",
                              color: "#2c3e50",
                              border: "1px solid #dee2e6",
                              minWidth: "100px",
                            }}
                          >
                            {monthKey}
                          </th>
                        ))}
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#2c3e50",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {Object.keys(data).length === 0 ? (
                        <tr>
                          <td
                            colSpan={months.length + 2}
                            style={{
                              padding: "2rem",
                              textAlign: "center",
                              color: "#7f8c8d",
                              fontStyle: "italic",
                            }}
                          >
                            No records found
                          </td>
                        </tr>
                      ) : (
                        <>
                          {Object.entries(data).map(([brandName, details]) => {
                            const visibleTotal = months.reduce(
                              (sum, m) =>
                                sum + (details.details[m]?.amount || 0),
                              0
                            );
                            return (
                              <tr key={brandName}>
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "500",
                                    color: "#2c3e50",
                                    border: "1px solid #dee2e6",
                                  }}
                                >
                                  {brandName}
                                </td>
                                {months.map((m) => (
                                  <td
                                    key={m}
                                    style={{
                                      padding: "0.75rem",
                                      textAlign: "center",
                                      border: "1px solid #dee2e6",
                                      color: details.details[m]
                                        ? "#1abc9c"
                                        : "#bdc3c7",
                                      fontWeight: details.details[m]
                                        ? "500"
                                        : "400",
                                    }}
                                  >
                                    {details.details[m]
                                      ? formatCurrency(
                                          details.details[m].amount
                                        )
                                      : "-"}
                                  </td>
                                ))}
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    border: "1px solid #dee2e6",
                                    backgroundColor: "#f8f9fa",
                                  }}
                                >
                                  {formatCurrency(visibleTotal)}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Grand Total Row */}
                          <tr
                            style={{
                              backgroundColor: "#2c3e50",
                              color: "white",
                              fontWeight: "600",
                            }}
                          >
                            <td
                              style={{
                                padding: "0.75rem",
                                border: "1px solid #34495e",
                              }}
                            >
                              GRAND TOTAL
                            </td>
                            {months.map((m) => {
                              const monthTotal = Object.values(data).reduce(
                                (sum, entity) =>
                                  sum + (entity.details[m]?.amount || 0),
                                0
                              );
                              return (
                                <td
                                  key={m}
                                  style={{
                                    padding: "0.75rem",
                                    textAlign: "center",
                                    border: "1px solid #34495e",
                                  }}
                                >
                                  {monthTotal > 0
                                    ? formatCurrency(monthTotal)
                                    : "-"}
                                </td>
                              );
                            })}
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "center",
                                border: "1px solid #34495e",
                              }}
                            >
                              {formatCurrency(
                                Object.values(data).reduce(
                                  (sum, entity) =>
                                    sum +
                                    months.reduce(
                                      (ms, m) =>
                                        ms + (entity.details[m]?.amount || 0),
                                      0
                                    ),
                                  0
                                )
                              )}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </>
              );

              // Render both tables
              return (
                <>
                  {renderTable(groupedData, allMonths, "Brand Payments")}

                  {/* Rent Payments Table with Remarks */}
                  {Object.keys(groupedRentData).length > 0 && (
                    <>
                      <h3
                        style={{
                          marginBottom: "0.5rem",
                          color: "#2c3e50",
                          fontWeight: "700",
                          fontSize: "1.1rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Rent Payments
                      </h3>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.85rem",
                          marginBottom: "2rem",
                        }}
                      >
                        <thead
                          style={{
                            backgroundColor: "#f8f9fa",
                            borderBottom: "2px solid #dee2e6",
                          }}
                        >
                          <tr>
                            <th
                              style={{
                                padding: "0.75rem",
                                textAlign: "left",
                                fontWeight: "600",
                                color: "#2c3e50",
                                border: "1px solid #dee2e6",
                              }}
                            >
                              Brand Name
                            </th>
                            {rentMonths.map((monthKey) => (
                              <th
                                key={monthKey}
                                style={{
                                  padding: "0.75rem",
                                  textAlign: "center",
                                  fontWeight: "600",
                                  color: "#2c3e50",
                                  border: "1px solid #dee2e6",
                                  minWidth: "100px",
                                }}
                              >
                                {monthKey}
                              </th>
                            ))}
                            <th
                              style={{
                                padding: "0.75rem",
                                textAlign: "center",
                                fontWeight: "600",
                                color: "#2c3e50",
                                border: "1px solid #dee2e6",
                              }}
                            >
                              Total
                            </th>
                            <th
                              style={{
                                padding: "0.75rem",
                                textAlign: "center",
                                fontWeight: "600",
                                color: "#2c3e50",
                                border: "1px solid #dee2e6",
                                minWidth: "200px",
                              }}
                            >
                              Remarks
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {Object.keys(groupedRentData).length === 0 ? (
                            <tr>
                              <td
                                colSpan={rentMonths.length + 3}
                                style={{
                                  padding: "2rem",
                                  textAlign: "center",
                                  color: "#7f8c8d",
                                  fontStyle: "italic",
                                }}
                              >
                                No rent payment records found
                              </td>
                            </tr>
                          ) : (
                            <>
                              {Object.entries(groupedRentData).map(
                                ([brandName, details]) => {
                                  const visibleTotal = rentMonths.reduce(
                                    (sum, m) =>
                                      sum +
                                      (details.details[m]?.rentAmount || 0),
                                    0
                                  );
                                  return (
                                    <tr key={brandName}>
                                      <td
                                        style={{
                                          padding: "0.75rem",
                                          fontWeight: "500",
                                          color: "#2c3e50",
                                          border: "1px solid #dee2e6",
                                        }}
                                      >
                                        {brandName}
                                      </td>
                                      {rentMonths.map((m) => (
                                        <td
                                          key={m}
                                          style={{
                                            padding: "0.75rem",
                                            textAlign: "center",
                                            border: "1px solid #dee2e6",
                                            color: details.details[m]
                                              ? "#1abc9c"
                                              : "#bdc3c7",
                                            fontWeight: details.details[m]
                                              ? "500"
                                              : "400",
                                          }}
                                        >
                                          {details.details[m]
                                            ? formatCurrencyRent(
                                                details.details[m].rentAmount
                                              )
                                            : "-"}
                                        </td>
                                      ))}
                                      <td
                                        style={{
                                          padding: "0.75rem",
                                          textAlign: "center",
                                          fontWeight: "600",
                                          color: "#2c3e50",
                                          border: "1px solid #dee2e6",
                                          backgroundColor: "#f8f9fa",
                                        }}
                                      >
                                        {formatCurrencyRent(visibleTotal)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "0.75rem",
                                          textAlign: "left",
                                          color: "#7f8c8d",
                                          border: "1px solid #dee2e6",
                                          fontSize: "0.8rem",
                                          fontStyle: details.remarks
                                            ? "normal"
                                            : "italic",
                                        }}
                                      >
                                        {details.remarks || "No remarks"}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}

                              {/* Grand Total Row */}
                              <tr
                                style={{
                                  backgroundColor: "#2c3e50",
                                  color: "white",
                                  fontWeight: "600",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    border: "1px solid #34495e",
                                  }}
                                >
                                  GRAND TOTAL
                                </td>
                                {rentMonths.map((m) => {
                                  const monthTotal = Object.values(
                                    groupedRentData
                                  ).reduce(
                                    (sum, entity) =>
                                      sum +
                                      (entity.details[m]?.rentAmount || 0),
                                    0
                                  );
                                  return (
                                    <td
                                      key={m}
                                      style={{
                                        padding: "0.75rem",
                                        textAlign: "center",
                                        border: "1px solid #34495e",
                                      }}
                                    >
                                      {monthTotal > 0
                                        ? formatCurrencyRent(monthTotal)
                                        : "-"}
                                    </td>
                                  );
                                })}
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    textAlign: "center",
                                    border: "1px solid #34495e",
                                  }}
                                >
                                  {formatCurrencyRent(
                                    Object.values(groupedRentData).reduce(
                                      (sum, entity) =>
                                        sum +
                                        rentMonths.reduce(
                                          (ms, m) =>
                                            ms +
                                            (entity.details[m]?.rentAmount ||
                                              0),
                                          0
                                        ),
                                      0
                                    )
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "0.75rem",
                                    textAlign: "center",
                                    border: "1px solid #34495e",
                                    fontStyle: "italic",
                                  }}
                                >
                                  -
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </section>
    </div>
  );
}
