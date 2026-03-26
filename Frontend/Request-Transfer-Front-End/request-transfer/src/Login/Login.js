// import React, { useState } from "react";
// import API from "../api";
// import "./Login.css";

// export default function Login() {
//   const [workEmail, setWorkEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const loginUser = async () => {
//     if (!workEmail || !password) {
//       alert("Please enter both email and password.");
//       return;
//     }

//     const payload = { workEmail, password };
//     console.log("Logging in with:", payload); // debug

//     try {
//       const res = await API.post("/User/Login", payload);

//       console.log("Login success:", res.data);
//       alert("Login Successful! Welcome " + res.data.username);

//       // Optionally, save user info in localStorage or state
//       localStorage.setItem("user", JSON.stringify(res.data));

//       // Redirect or navigate to dashboard
//       // e.g., navigate("/dashboard");
//     } catch (error) {
//       console.error("Error logging in:", error);
//       if (error.response) {
//         console.log("Server response:", error.response.data);
//         alert(
//           "Login failed: " +
//             (error.response.data.message || JSON.stringify(error.response.data))
//         );
//       } else {
//         alert("Login failed. Please try again.");
//       }
//     }
//   };

//   return (
//     <div className="login-container">
//       <h2>Login</h2>
//       <input
//         placeholder="Email"
//         value={workEmail}
//         onChange={(e) => setWorkEmail(e.target.value)}
//       />
//       <input
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />
//       <button onClick={loginUser}>Login</button>
//     </div>
//   );
// }
