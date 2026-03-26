import React, { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

const WeeklyPayments = ({ user }) => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchType, setSelectedBranchType] = useState("preparedBy");
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.id) {
      fetchWeeklyData();
    } else {
      setError("User not available. Please login again.");
      setLoading(false);
    }
  }, [user]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching weekly data for user:", user);
      console.log("User ID:", user.id);

      const response = await API.get(`/WeeklyPayment/dashboard/${user.id}`);
      console.log("Weekly data response:", response.data);

      // Debug: Check if bank facility data exists
      if (response.data.bankFacilityByType) {
        console.log("Bank Facility data:", response.data.bankFacilityByType);
      }

      setWeeklyData(response.data);
    } catch (error) {
      console.error("Error fetching weekly data:", error);

      if (error.response?.status === 400) {
        setError("Bad request. Please check if user ID is correct.");
      } else if (error.response?.status === 404) {
        setError("Weekly payment endpoint not found. Please check the URL.");
      } else if (error.code === "ERR_NETWORK") {
        setError(
          "Cannot connect to server. Please make sure the backend is running."
        );
      } else {
        setError(error.response?.data?.message || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const backtodashboard = () => {
    navigate("/dashboard");
  };

  const fetchBranchDetail = async (branchName, type = "preparedBy") => {
    try {
      setSelectedBranchType(type);

      if (type === "preparedBy") {
        const response = await API.get(
          `/WeeklyPayment/branch-detail/${user.id}/${encodeURIComponent(
            branchName
          )}`
        );
        setSelectedBranch({
          name: branchName,
          data: response.data.preparedByData || response.data,
          type: "preparedBy",
        });
      } else if (type === "amountToPay") {
        const response = await API.get(
          `/WeeklyPayment/amount-topay-branch/${user.id}/${encodeURIComponent(
            branchName
          )}`
        );
        setSelectedBranch({
          name: branchName,
          data: response.data,
          type: "amountToPay",
        });
      } else if (type === "bankFacility") {
        const response = await API.get(
          `/WeeklyPayment/bank-facility-branch/${user.id}/${encodeURIComponent(
            branchName
          )}`
        );
        setSelectedBranch({
          name: branchName,
          data: response.data,
          type: "bankFacility",
        });
      }
    } catch (error) {
      console.error("Error fetching branch detail:", error);
      setError(error.response?.data || error.message);
    }
  };

  // Helper function to check if brand data exists and has content
  const hasBrandData = () => {
    if (!weeklyData) return false;

    if (
      weeklyData.amountToPayByBranch &&
      weeklyData.amountToPayByBranch.length > 0
    ) {
      return weeklyData.amountToPayByBranch.some(
        (branch) => branch.amounts && branch.amounts.length > 0
      );
    }

    if (weeklyData.amountToPayData && weeklyData.amountToPayData.length > 0) {
      return true;
    }

    return false;
  };

  // Helper function to check if bank facility data exists
  const hasBankFacilityData = () => {
    if (!weeklyData || !weeklyData.bankFacilityByType) return false;

    const { Trading, Catering } = weeklyData.bankFacilityByType;
    return (
      (Trading?.Facilities && Trading.Facilities.length > 0) ||
      (Catering?.Facilities && Catering.Facilities.length > 0)
    );
  };

  // Helper function to get brand data for display
  const getBrandDataToDisplay = () => {
    if (!weeklyData) return [];

    if (
      weeklyData.amountToPayByBranch &&
      weeklyData.amountToPayByBranch.length > 0
    ) {
      return weeklyData.amountToPayByBranch;
    }

    if (weeklyData.amountToPayData && weeklyData.amountToPayData.length > 0) {
      const groupedByBranch = weeklyData.amountToPayData.reduce((acc, item) => {
        const branch = item.Branch || "Unknown Branch";
        if (!acc[branch]) {
          acc[branch] = {
            branch: branch,
            amounts: [],
            totalRentAmount: 0,
            totalRegularAmount: 0,
            totalAmount: 0,
          };
        }

        const rentAmount = item.RentAmount || 0;
        const regularAmount = item.RegularAmount || 0;
        const totalAmount = rentAmount + regularAmount;

        acc[branch].amounts.push({
          brandName: item.BrandName,
          rentAmount: rentAmount,
          regularAmount: regularAmount,
          totalAmount: totalAmount,
          textForMessage: item.textForMessage,
          UserName: item.UserName,
        });

        acc[branch].totalRentAmount += rentAmount;
        acc[branch].totalRegularAmount += regularAmount;
        acc[branch].totalAmount += totalAmount;

        return acc;
      }, {});

      return Object.values(groupedByBranch);
    }

    return [];
  };

  // Show loading state
  if (loading)
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          fontSize: "18px",
        }}
      >
        <div>Loading weekly payments data...</div>
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          User: {user?.username} (ID: {user?.id})
        </div>
      </div>
    );

  // Show error state
  if (error)
    return (
      <div
        style={{
          padding: "20px",
          color: "#d32f2f",
          backgroundColor: "#ffebee",
          border: "1px solid #f44336",
          borderRadius: "4px",
          margin: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Error Loading Weekly Payments</h3>
        <p style={{ margin: "0 0 15px 0" }}>{error}</p>
        <div style={{ marginBottom: "10px", fontSize: "14px" }}>
          <strong>Debug Info:</strong>
          <br />
          User ID: {user?.id}
          <br />
          User Object Keys: {user ? Object.keys(user).join(", ") : "No user"}
        </div>
        <button
          onClick={fetchWeeklyData}
          style={{
            padding: "8px 16px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    );

  // Show if no data
  if (!weeklyData)
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>No Weekly Payments Data Available</h3>
        <p>There is no payment data for the current week.</p>
      </div>
    );

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          borderBottom: "2px solid #333",
          paddingBottom: "10px",
        }}
      >
        <button className="goBack" onClick={backtodashboard}>
          ← Back to Dashboard
        </button>
        <h2 style={{ margin: 0, color: "#333" }}>WEEKLY PAYMENTS</h2>
        <div style={{ fontWeight: "bold", color: "#666" }}>
          PAYMENT SCHEDULE: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Bank Balances Section */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ marginBottom: "15px", color: "#333" }}>
          TOTAL BALANCE IN BANK
        </h3>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {weeklyData.bankPositions && weeklyData.bankPositions.length > 0 ? (
            weeklyData.bankPositions.map((bank, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  backgroundColor: "#f9f9f9",
                  minWidth: "200px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "5px",
                  }}
                >
                  {bank.bankName}
                </span>
                <span
                  style={{
                    fontSize: "1.2em",
                    color: "#2c5aa0",
                    fontWeight: "bold",
                  }}
                >
                  {bank.amount?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: "15px", color: "#666" }}>
              No bank data available
            </div>
          )}
        </div>
      </div>

      {/* Bank Facility Section - Trading */}
      {hasBankFacilityData() &&
        weeklyData.bankFacilityByType.Trading?.Facilities &&
        weeklyData.bankFacilityByType.Trading.Facilities.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h3
              style={{
                marginBottom: "15px",
                color: "#333",
                borderBottom: "2px solid #ff6b35",
                paddingBottom: "5px",
              }}
            >
              BANK FACILITY - TRADING
            </h3>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "5px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fff3e0",
                  padding: "15px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #ddd",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8f8f8" }}>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        SUPPLIER
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        BANK
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        AMOUNT
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        BRANCH
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.bankFacilityByType.Trading.Facilities.map(
                      (facility, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {facility.SupplierName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {facility.BankName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                            }}
                          >
                            {facility.AmountOFFacillities?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {facility.Branch}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#ffe0b2" }}>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        TRADING TOTAL
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                        }}
                      ></td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        {weeklyData.bankFacilityByType.Trading.TotalAmount?.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                        }}
                      ></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Bank Facility Section - Catering */}
      {hasBankFacilityData() &&
        weeklyData.bankFacilityByType.Catering?.Facilities &&
        weeklyData.bankFacilityByType.Catering.Facilities.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h3
              style={{
                marginBottom: "15px",
                color: "#333",
                borderBottom: "2px solid #4caf50",
                paddingBottom: "5px",
              }}
            >
              BANK FACILITY - CATERING
            </h3>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "5px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#e8f5e8",
                  padding: "15px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #ddd",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8f8f8" }}>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        SUPPLIER
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        BANK
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        AMOUNT
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        BRANCH
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.bankFacilityByType.Catering.Facilities.map(
                      (facility, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {facility.SupplierName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {facility.BankName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                            }}
                          >
                            {facility.AmountOFFacillities?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {facility.Branch}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#c8e6c9" }}>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        CATERING TOTAL
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                        }}
                      ></td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        {weeklyData.bankFacilityByType.Catering.TotalAmount?.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                        }}
                      ></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Amount to Pay Section */}
      {hasBrandData() ? (
        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              marginBottom: "15px",
              color: "#333",
              borderBottom: "2px solid #2c5aa0",
              paddingBottom: "5px",
            }}
          >
            Payment Request - Other Amounts
          </h3>
          {getBrandDataToDisplay().map((branch, index) => (
            <div
              key={index}
              style={{
                marginBottom: "20px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                overflow: "hidden",
              }}
            >
              {/* Branch Header */}
              <div
                style={{
                  backgroundColor: "#e8f4fd",
                  padding: "10px 15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0, color: "#333" }}>
                  {/* {branch.branch?.toUpperCase() || "UNKNOWN BRANCH"} - Other */}
                  OtherAmounts
                </h3>
                <button
                  onClick={() =>
                    fetchBranchDetail(branch.branch, "amountToPay")
                  }
                  style={{
                    background: "#2c5aa0",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  View Brand Details
                </button>
              </div>

              {/* Brands Table */}
              <div style={{ padding: "15px" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #ddd",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8f8f8" }}>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        BRAND
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        RENT AMOUNT
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        REGULAR AMOUNT
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        TOTAL AMOUNT
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        REMARKS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {branch.amounts &&
                      branch.amounts.map((brand, bIndex) => (
                        <tr key={bIndex}>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {brand.brandName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {brand.rentAmount > 0
                              ? brand.rentAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "-"}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {brand.regularAmount > 0
                              ? brand.regularAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "-"}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                            }}
                          >
                            {brand.totalAmount > 0
                              ? brand.totalAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "-"}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              maxWidth: "300px",
                              wordWrap: "break-word",
                              fontStyle: !brand.textForMessage
                                ? "italic"
                                : "normal",
                              color: !brand.textForMessage ? "#666" : "#000",
                            }}
                          >
                            {brand.textForMessage || "No remarks"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#e8f4fd" }}>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        BRAND TOTALS
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        {branch.totalRentAmount?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        {branch.totalRegularAmount?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        {branch.totalAmount?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                        {/* Empty for remarks column */}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "5px",
          }}
        >
          <h3 style={{ color: "#856404", marginBottom: "10px" }}>
            No Brand Payment Data Available
          </h3>
          <p style={{ color: "#856404", margin: 0 }}>
            There are no brand payments to display. This could be because:
          </p>
          <ul
            style={{ color: "#856404", margin: "10px 0", paddingLeft: "20px" }}
          >
            <li>No brand payments have been created yet</li>
            <li>
              Brand payments exist but are outside the current week date range
            </li>
            <li>There might be an issue with the data connection</li>
          </ul>
        </div>
      )}

      {/* PreparedBy Branch Sections */}
      <div>
        <h3
          style={{
            marginBottom: "15px",
            color: "#333",
            borderBottom: "2px solid #2c5aa0",
            paddingBottom: "5px",
          }}
        >
          PREPARED BY - SUPPLIER PAYMENTS
        </h3>
        {weeklyData.branchData && weeklyData.branchData.length > 0 ? (
          weeklyData.branchData.map((branch, index) => (
            <div
              key={index}
              style={{
                marginBottom: "30px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                overflow: "hidden",
              }}
            >
              {/* Branch Header */}
              <div
                style={{
                  backgroundColor: "#f0f0f0",
                  padding: "10px 15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0, color: "#333" }}>
                  {branch.branch?.toUpperCase() || "UNKNOWN BRANCH"}
                </h3>
                <button
                  onClick={() => fetchBranchDetail(branch.branch, "preparedBy")}
                  style={{
                    background: "#2c5aa0",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  View Supplier Details
                </button>
              </div>

              {/* Suppliers Table */}
              <div style={{ padding: "15px" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #ddd",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8f8f8" }}>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        SUPPLIERS
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        REQ AMOUNT
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        PAID
                      </th>
                      {/* <th
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        REMARKS
                      </th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {branch.suppliers &&
                      branch.suppliers.map((supplier, sIndex) => (
                        <tr key={sIndex}>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {supplier.supplierName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {supplier.paymentDue?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {supplier.otherAmount?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          {/* <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              maxWidth: "300px",
                              wordWrap: "break-word",
                              fontStyle: "italic",
                              color: "#666",
                            }}
                          >
                            {supplier.remarks || "No remarks"}
                          </td> */}
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#e8f4fd" }}>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        TOTAL AMOUNT
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        {branch.totalAmount?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        {branch.totalOtherAmount?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                        {/* Empty for remarks column */}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
            No supplier payment data available for this week
          </div>
        )}
      </div>

      {/* Enhanced Totals Section */}
      {weeklyData.totals && (
        <div
          style={{
            marginTop: "30px",
            borderTop: "2px solid #333",
            paddingTop: "15px",
          }}
        >
          <h3 style={{ marginBottom: "15px", color: "#333" }}>
            SUMMARY TOTALS
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #ddd",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f8f8" }}>
                <th
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "left",
                  }}
                >
                  CATEGORY
                </th>
                <th
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                  }}
                >
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    fontWeight: "bold",
                  }}
                >
                  Total Bank Balance
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {weeklyData.totals.totalBankBalance?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Total Payment Due
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                  }}
                >
                  {weeklyData.totals.totalPaymentDue?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Total Paid (Amount By Approver)
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                  }}
                >
                  {weeklyData.totals.totalOtherAmount?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Total Rent Amount
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                  }}
                >
                  {weeklyData.totals.totalRentAmount?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Total Regular Amount
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                  }}
                >
                  {weeklyData.totals.totalRegularAmount?.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px",
                    border: "2px solid #333",
                    backgroundColor: "#333",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  <span>BANK FACILITY TRADING</span>
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "2px solid #333",
                    textAlign: "right",
                    backgroundColor: "#333",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {weeklyData.totals.totalTradingAmount?.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px",
                    border: "2px solid #333",
                    backgroundColor: "#333",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  <span>BANK FACILITY CATERING</span>
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "2px solid #333",
                    textAlign: "right",
                    backgroundColor: "#333",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {weeklyData.totals.totalCateringAmount?.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>
              </tr>

              <tr style={{ backgroundColor: "#e8f4fd" }}>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    fontWeight: "bold",
                  }}
                >
                  GRAND TOTAL
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                    fontWeight: "bold",
                    fontSize: "1.1em",
                  }}
                >
                  {weeklyData.totals.grandTotal?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Enhanced Branch Detail Modal */}
      {selectedBranch && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "5px",
              maxWidth: "90%",
              maxHeight: "90%",
              overflow: "auto",
              width: "1000px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
                borderBottom: "1px solid #ddd",
                paddingBottom: "10px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {selectedBranch.name} -{" "}
                {selectedBranch.type === "amountToPay"
                  ? "Brand"
                  : selectedBranch.type === "bankFacility"
                  ? "Bank Facility"
                  : "Supplier"}{" "}
                Details
              </h3>
              <button
                onClick={() => setSelectedBranch(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5em",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid #ddd",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f8f8f8" }}>
                    {selectedBranch.type === "amountToPay" ? (
                      <>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Brand
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Rent Amount
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Regular Amount
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Total Amount
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Remarks
                        </th>
                      </>
                    ) : selectedBranch.type === "bankFacility" ? (
                      <>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Supplier
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Bank
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Amount
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Type
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Supplier
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Payment Due
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Amount By Approver
                        </th>
                        <th
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedBranch.data.map((item, index) => (
                    <tr key={index}>
                      {selectedBranch.type === "amountToPay" ? (
                        <>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.brandName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.rentAmount?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.regularAmount?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                            }}
                          >
                            {item.totalAmount?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              maxWidth: "300px",
                              wordWrap: "break-word",
                            }}
                          >
                            {item.textForMessage || "No remarks"}
                          </td>
                        </>
                      ) : selectedBranch.type === "bankFacility" ? (
                        <>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.SupplierName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.BankName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                              fontWeight: "bold",
                            }}
                          >
                            {item.Amount?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.FacilityType}
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.supplierName}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.paymentDue?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.otherAmount?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {item.currentStatus}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPayments;
