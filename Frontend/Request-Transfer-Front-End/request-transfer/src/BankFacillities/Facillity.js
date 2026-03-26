import React, { useState, useEffect } from "react";
import API from "../api";
import "./Facillity.css";

export default function Facillity({ user }) {
  const [banks, setBanks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [facillityamount, setFacillityAmount] = useState("");
  const [userSelectedDate, setUserSelectedDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch banks + suppliers when user is loaded
  useEffect(() => {
    if (!user) return;

    const fetchBanks = async () => {
      try {
        const res = await API.get("/BankFacillity/banksbf");
        setBanks(res.data);
      } catch (err) {
        console.error("Error fetching banks:", err);
        setMessage("❌ Failed to load banks");
      }
    };

    const fetchSuppliers = async () => {
      try {
        const res = await API.get("/BankFacillity/suppliersbf");
        setSuppliers(res.data);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setMessage("❌ Failed to load suppliers");
      }
    };

    fetchBanks();
    fetchSuppliers();
  }, [user]);

  const handleBankChange = (e) => {
    const bankId = e.target.value;
    const bank = banks.find((b) => b.id === parseInt(bankId));
    setSelectedBank(bank || null);
  };

  const handleSupplierChange = (e) => {
    const supplierId = e.target.value;
    const supplier = suppliers.find((s) => s.id === parseInt(supplierId));
    setSelectedSupplier(supplier || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      !selectedBank ||
      !selectedSupplier ||
      !facillityamount ||
      !userSelectedDate
    ) {
      alert("Please select bank, supplier, amount and date.");
      setLoading(false);
      return;
    }

    try {
      const res = await API.post("/BankFacillity/entries", {
        banksId: selectedBank.id,
        supplierBfId: selectedSupplier.id,
        userId: user?.id,
        amountOFFacillities: parseFloat(facillityamount),
        userCreatedDate: new Date(userSelectedDate).toISOString(),
      });

      setMessage(
        res.data.message ||
          `✅ Successfully added entry for ${selectedBank.bankName} - Supplier: ${selectedSupplier.supplierBFName}`
      );

      // Reset form
      setFacillityAmount("");
      setSelectedBank(null);
      setSelectedSupplier(null);
      setUserSelectedDate("");

      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (error) {
      console.error("Error submitting bank entry:", error);
      setMessage(
        error.response?.data?.message || "❌ Submission failed. Try again."
      );

      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage("");
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFacillityAmount("");
    setSelectedBank(null);
    setSelectedSupplier(null);
    setUserSelectedDate("");
    setMessage("");
  };

  return (
    <div className="facility-container">
      <div className="facility-form-wrapper">
        <div className="facility-header">
          <img src="/Adma-logo.png" alt="Logo" />
          <div className="facility-header-content">
            <h1>Bank Facility Form</h1>
            <p>Enter bank transaction details</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={loading ? "facility-form-loading" : ""}
        >
          <div className="facility-grid">
            {/* SELECT BANK */}
            <div className="facility-form-group">
              <label>Select Bank</label>
              <select
                onChange={handleBankChange}
                value={selectedBank?.id || ""}
                disabled={loading}
              >
                <option value="">-- Choose a Bank --</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.banksName}
                  </option>
                ))}
              </select>
            </div>

            {/* SELECT SUPPLIER */}
            <div className="facility-form-group">
              <label>Select Supplier</label>
              <select
                onChange={handleSupplierChange}
                value={selectedSupplier?.id || ""}
                disabled={loading}
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.supplierBFName}
                  </option>
                ))}
              </select>
            </div>

            {/* BANK NAME (Read-only) */}
            <div className="facility-form-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={selectedBank?.banksName || "No bank selected"}
                readOnly
                className={selectedBank ? "facility-bank-account" : ""}
                placeholder="Select a bank above"
              />
            </div>

            {/* ACCOUNT NUMBER (Read-only) */}
            <div className="facility-form-group">
              <label>Account Number</label>
              <input
                type="text"
                value={selectedBank?.banksaccount || "No account number"}
                readOnly
                className={selectedBank ? "facility-bank-account" : ""}
                placeholder="Select a bank above"
              />
            </div>

            {/* AMOUNT */}
            <div className="facility-form-group">
              <label>Amount (SAR)</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={facillityamount}
                onChange={(e) => setFacillityAmount(e.target.value)}
                step="0.01"
                min="0"
                disabled={loading}
                required
              />
            </div>

            {/* DATE */}
            <div className="facility-form-group">
              <label>Date</label>
              <input
                type="date"
                value={userSelectedDate}
                onChange={(e) => setUserSelectedDate(e.target.value)}
                disabled={loading}
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="facility-button-group">
            <button
              className="facility-submit-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

        {message && (
          <div
            className={
              message.includes("❌")
                ? "facility-error-message"
                : "facility-success-message"
            }
          >
            {message}
            <button
              className="facility-message-close"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="facility-loading-overlay">
            <div className="facility-loading-spinner"></div>
            <p>Processing your request...</p>
          </div>
        )}
      </div>
    </div>
  );
}
