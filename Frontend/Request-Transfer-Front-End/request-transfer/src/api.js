import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  // baseURL: "https://localhost:7031/api",
  headers: { "Content-Type": "application/json" },
});

export default API;
