import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8077", // backend base URL (no /api)
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
