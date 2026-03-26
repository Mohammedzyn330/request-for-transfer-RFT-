import React, { useState, useEffect } from "react";
import API from "../api";
import "./BankPosition.css";

export default function BankPosition({ user }) {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // Fetch banks only after user is available
  useEffect(() => {
    if (!user) return;

    const fetchBanks = async () => {
      try {
        const res = await API.get("/Bank");
        setBanks(res.data);
      } catch (err) {
        console.error("Error fetching banks:", err);
      }
    };

    fetchBanks();
  }, [user]);

  const handleBankChange = (e) => {
    const bankId = e.target.value;
    const bank = banks.find((b) => b.id === parseInt(bankId));
    setSelectedBank(bank || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBank || !amount || !user) {
      alert(
        "Please select a bank, enter an amount, and make sure you are logged in."
      );
      return;
    }

    try {
      const res = await API.post("/BankPosition/entries", {
        bankId: selectedBank.id,
        userId: user?.id,
        amount: parseFloat(amount),
      });

      setMessage(
        res.data.message ||
          `✅ Successfully added ${selectedBank.bankName} - ${amount} SAR`
      );
      setAmount("");
      setSelectedBank(null);
    } catch (error) {
      console.error("Error submitting bank entry:", error);
      setMessage(
        error.response?.data?.message || "❌ Submission failed. Try again."
      );
    }
  };

  return (
    <div className="bank-position-container">
      <div className="bank-position-form-wrapper">
        <div className="bank-position-header">
          <img src="/Adma-logo.png" alt="Logo" />
          <div className="bank-position-header-content">
            <h1>Bank Position Form</h1>
            <p>Enter bank position details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bank-position-grid">
            <div className="bank-position-form-group">
              <label>Select Bank</label>
              <select
                onChange={handleBankChange}
                value={selectedBank?.id || ""}
              >
                <option value="">-- Choose a Bank --</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName}
                  </option>
                ))}
              </select>
            </div>

            <div className="bank-position-form-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={selectedBank?.bankName || ""}
                readOnly
                className={
                  selectedBank?.bankName ? "bank-position-highlight" : ""
                }
              />
            </div>

            <div className="bank-position-form-group">
              <label>Account Number</label>
              <input
                type="text"
                value={selectedBank?.bankAccount || ""}
                readOnly
                className={
                  selectedBank?.bankAccount
                    ? "bank-position-account-number"
                    : ""
                }
              />
            </div>

            <div className="bank-position-form-group">
              <label>Amount (SAR)</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className={amount ? "bank-position-amount-input" : ""}
              />
            </div>
          </div>

          <button className="bank-position-submit-button" type="submit">
            Submit
          </button>
        </form>

        {message && (
          <div
            className={
              message.includes("✅")
                ? "bank-position-error-message"
                : "bank-position-success-message"
            }
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
