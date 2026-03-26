// import React, { useState } from "react";
// import API from "../api";
// import "./Register.css";

// export default function Register() {
//   const [userName, setUserName] = useState("");
//   const [workEmail, setWorkEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [userIqama, setUserIqama] = useState("");
//   const [department, setDepartment] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [branch, setBranch] = useState("");

//   //API CALLING FOR THE REGISTRATION OF THE USER ACCOUNT
//   const registerUser = async () => {
//     try {
//       const res = await API.post("/User/register", {
//         userName: userName,
//         workEmail: workEmail,
//         password: password,
//         department: department,
//         phoneNumber: phoneNumber,
//         iqamaNo: userIqama,
//         branch: branch,
//       });

//       console.log("User registered:", res.data);
//       alert("User registered successfully!");
//     } catch (error) {
//       console.error("Error registering user:", error);
//       if (error.response && error.response.data?.message) {
//         alert("Error: " + error.response.data.message);
//       } else {
//         alert("Registration failed. Please try again.");
//       }
//     }
//   };

//   return (
//     <div className="register-container">
//       <h2>Register</h2>
//       <input
//         placeholder="Name"
//         value={userName}
//         onChange={(e) => setUserName(e.target.value)}
//       />
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
//       <input
//         placeholder="IqmaNo"
//         value={userIqama}
//         onChange={(e) => setUserIqama(e.target.value)}
//       />
//       <input
//         placeholder="Department"
//         value={department}
//         onChange={(e) => setDepartment(e.target.value)}
//       />
//       <input
//         placeholder="Phone Number"
//         value={phoneNumber}
//         onChange={(e) => setPhoneNumber(e.target.value)}
//       />
//       <input
//         placeholder="Branch"
//         value={branch}
//         onChange={(e) => setBranch(e.target.value)}
//       />
//       <button onClick={registerUser}>Register</button>
//     </div>
//   );
// }
