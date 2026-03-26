import React, { useState, useEffect } from "react";
import API from "../api";
import "./Amount.css";

export default function Amount({ user }) {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [amountToPay, setAmountToPay] = useState("");
  const [textForMessage, setTextForMessage] = useState("");
  const [rentPaymentsAmount, setRentPaymentsAmount] = useState("");
  const [userSelectedDate, setUserSelectedDate] = useState("");
  const [message, setMessage] = useState("");
  const [otherBrandName, setOtherBrandName] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchBrands = async () => {
      try {
        const res = await API.get("/Brand");
        setBrands(res.data);
      } catch (err) {
        console.error("Error fetching brands:", err);
      }
    };

    fetchBrands();
  }, [user]);

  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    const brand = brands.find((br) => br.id === parseInt(brandId));
    setSelectedBrand(brand || null);
    setRentPaymentsAmount("");
    setTextForMessage("");
    setOtherBrandName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !userSelectedDate) {
      alert("Please make sure you are logged in and select a date.");
      return;
    }

    // Validate amount for non-RentPayments brands
    if (
      selectedBrand?.brandName !== "RentPayments" &&
      (!amountToPay || parseFloat(amountToPay) <= 0)
    ) {
      alert("Please enter a valid amount to pay.");
      return;
    }

    let brandId = selectedBrand?.id;
    let brandName = selectedBrand?.brandName;

    // for other input
    if (brandName === "Others") {
      if (!otherBrandName.trim()) {
        alert("Please enter the brand name for 'Others'.");
        return;
      }

      // Create new brand first
      try {
        const newBrandRes = await API.post("/Brand", {
          brandName: otherBrandName.trim(),
        });
        brandId = newBrandRes.data.id;
        brandName = newBrandRes.data.brandName;
      } catch (err) {
        console.error("Error adding new brand:", err);
        alert("Failed to add new brand.");
        return;
      }
    }

    // Prepare amount payload
    const data = {
      brandId: brandId,
      userId: user?.id,
      amountToPay: parseFloat(amountToPay || 0),
      userCreatedDate: userSelectedDate
        ? new Date(userSelectedDate).toISOString()
        : null,
    };

    //handle text for message
    const brandsNeedTexting = ["VAT", "Salaries", "RentPayments"];
    if (brandsNeedTexting.includes(brandName)) {
      if (!textForMessage.trim()) {
        alert("Please enter the message text for this brand");
        return;
      }
      data.textForMessage = textForMessage.trim();
    }

    // Handle RentPayments brand
    if (brandName === "RentPayments") {
      if (!rentPaymentsAmount) {
        alert("Please enter Rent Payments amount or text.");
        return;
      }
      data.rentPaymentsAmount = parseFloat(rentPaymentsAmount);
      data.textForMessage = textForMessage;
    }

    try {
      const res = await API.post("/Amounttopay/entries", data);
      setMessage(
        res.data.message ||
          `✅ Successfully added ${brandName} - ${amountToPay} SAR on ${userSelectedDate}`
      );

      // reset form
      setAmountToPay("");
      setRentPaymentsAmount("");
      setSelectedBrand(null);
      setUserSelectedDate("");
      setOtherBrandName("");
      setTextForMessage("");
    } catch (error) {
      console.error("Error submitting brand entry:", error);
      setMessage(
        error.response?.data?.message || "❌ Submission failed. Try again."
      );
    }
  };

  return (
    <div className="amount-container">
      <div className="amount-form-wrapper">
        <div className="amount-header">
          <img src="/Adma-logo.png" alt="Logo" />
          <div className="amount-header-content">
            <h1>Other Payments</h1>
            <p>Enter amount to pay to others</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="amount-grid">
            <div className="amount-form-group">
              <label>
                Select Brand{" "}
                <button
                  type="button"
                  onClick={async () => {
                    setIsRefreshing(true); // track loading
                    try {
                      const res = await API.get("/Brand");
                      setBrands(res.data);
                      alert("✅ Brands list refreshed!");
                    } catch (err) {
                      console.error("Error refreshing brands:", err);
                      alert("❌ Failed to refresh brands.");
                    }
                    setIsRefreshing(false);
                  }}
                  className={`refresh-btn ${isRefreshing ? "loading" : ""}`}
                >
                  <span className="icon">🔄</span>
                </button>
              </label>

              <select
                onChange={handleBrandChange}
                value={selectedBrand?.id || ""}
              >
                <option value="">-- Choose a Brand --</option>
                {[...brands]
                  .sort((a, b) =>
                    a.brandName === "Others"
                      ? -1
                      : b.brandName === "Others"
                      ? 1
                      : 0
                  )
                  .map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brandName}
                    </option>
                  ))}
              </select>
            </div>

            {/* if selected brand is others then */}
            {selectedBrand?.brandName === "Others" && (
              <div className="amount-form-group">
                <label>Enter Other Brand Name</label>
                <input
                  type="text"
                  placeholder="Enter new brand name"
                  value={otherBrandName}
                  onChange={(e) => setOtherBrandName(e.target.value)}
                />
              </div>
            )}

            <div className="amount-form-group">
              <label>Brand Name</label>
              <input
                type="text"
                value={
                  selectedBrand?.brandName === "Others"
                    ? otherBrandName
                    : selectedBrand?.brandName || ""
                }
                readOnly={selectedBrand?.brandName !== "Others"}
              />
            </div>

            {selectedBrand?.brandName !== "RentPayments" && (
              <div className="amount-form-group">
                <label>Amount to Pay (SAR)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            )}

            {selectedBrand?.brandName === "RentPayments" && (
              <div className="amount-form-group">
                <label>Rent Payments Amount (SAR)</label>
                {/* <input
                type="textarea"
                placeholder="Enter the text for the message"
                value={willaddfrombankend}
                onChange={
                  /> */}
                <input
                  type="number"
                  placeholder="Enter rent payments amount"
                  value={rentPaymentsAmount}
                  onChange={(e) => setRentPaymentsAmount(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
            )}

            {/*Text for Message (for VAT, Salaries, RentPayments) */}
            {["VAT", "Salary", "RentPayments"].includes(
              selectedBrand?.brandName
            ) && (
              <div className="amount-form-group">
                <label>Remarks</label>
                <textarea
                  placeholder="Enter remarks"
                  value={textForMessage}
                  onChange={(e) => setTextForMessage(e.target.value)}
                  rows="2"
                />
              </div>
            )}

            <div className="amount-form-group">
              <label>Date</label>
              <input
                type="date"
                value={userSelectedDate}
                onChange={(e) => setUserSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <button className="amount-submit-button" type="submit">
            Submit
          </button>
        </form>

        {message && (
          <div
            className={
              message.includes("✅")
                ? "amount-error-message"
                : "amount-success-message"
            }
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
