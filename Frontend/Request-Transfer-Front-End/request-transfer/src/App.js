import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import { Outlet } from "react-router-dom"; // Added this import

import Auth from "./Authentication/Auth";
import Form from "./RequestTransferForm/Form";
// import Varify from "./VarifierForm/Varify";
// import Approver from "./ApproverForm/Approver";
import Dashboard from "./Dashboardwaqas/Dashboardw";
import PreparerDashboard from "./PreparedbyDashboard/PreparerDashboard";
import Varify from "./VarifierDshboard/Varify";
import ApproverDashboard from "./ApproverDashboard/ApproverDsh";
import PaymentCompletionDashboard from "./PaymentCompletation/PaymentCompletionDashboard";
import Customer from "./CustomerAmountList/Customer";
import AdminDashboard from "./Admin/AdminDashboard";
import AdminRegister from "./Admin/AdminRegister";
import ExpectedCashFlow from "./Report/ExpectedCashFlow";
import WeeklyPayments from "./Payment Scedule/WeeklyPayments";

// import Facillity from "./BankFacillities/Facillity";
// import BankPostion from "./BankPostion/BankPostion";
// import Amount from "./AmountToPay/Amount";

// Admin Layout Component
const AdminLayout = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.roleId !== 5) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // This renders nested admin routes
};

function App() {
  // Initialize user from localStorage
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true); // NEW

  useEffect(() => {
    const loggedUser = localStorage.getItem("user");
    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
    }
    setLoadingUser(false);
  }, []);

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth setUser={setUser} />} />
        <Route path="Auth" element={<Auth />} />

        {/* ROLE 1 ACCESS */}
        <Route
          path="/form-prepare"
          element={
            user?.roleId === 1 ? (
              <Form user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/preparer-dashboard"
          element={
            user?.roleId === 1 ? (
              <PreparerDashboard user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/customer-list"
          element={
            user?.roleId === 1 ? (
              <Customer user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* ROLE 1 ACCESS END */}

        {/* ROLE 2 ACCESS */}
        <Route
          path="/verifier"
          element={
            user?.roleId === 2 ? (
              <Varify user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/report1"
          element={
            user?.roleId === 2 ? (
              <ExpectedCashFlow user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* ROLE 2 ACCESS END */}

        {/* ROLE 3 ACCESS */}
        <Route
          path="/report"
          element={
            user?.roleId === 3 ? (
              <ExpectedCashFlow user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/approver"
          element={
            user?.roleId === 3 ? (
              <ApproverDashboard user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* ROLE 3 ACCESS END */}

        {/* ROLE TEMP SEPERATE ASSIGNED */}
        {/* <Route
          path="/bankpostion"
          element={
            user?.roleId === 4 ? (
              <BankPostion user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        /> */}

        {/* <Route
          path="/amountopay"
          element={
            user?.roleId === 4 ? (
              <Amount user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        /> */}

        {/* <Route
          path="/bankfacillity"
          element={
            user?.roleId === 4 ? (
              <Facillity user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        /> */}
        {/* ROLE TEMP ASSIGNEDEND */}

        {/* ROLE 4 ACCESS*/}
        <Route
          path="/dashboard"
          element={
            user?.roleId === 4 ? (
              <Dashboard user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/weeklypayments"
          element={
            user?.roleId === 4 ? (
              <WeeklyPayments user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/payment-completion"
          element={
            user?.roleId === 4 ? (
              <PaymentCompletionDashboard user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* ROLE 4 ACCESS END */}

        {/* ROLE 5 ACCESS ADMIN*/}
        {/* <Route
          path="/admin/dashboard"
          element={
            user?.roleId === 5 ? (
              <AdminDashboard user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/register"
          element={
            user?.roleId === 5 ? (
              <AdminRegister user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        /> */}

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="register" element={<AdminRegister />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
