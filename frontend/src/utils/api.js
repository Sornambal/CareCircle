import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Adjust if backend runs on different host/port

// User registration
export const registerUser = (data) => {
  return axios.post(`${API_BASE_URL}/auth/register`, data);
};

// User login
export const loginUser = (data) => {
  return axios.post(`${API_BASE_URL}/auth/login`, data);
};

// Fetch medicines for user
export const fetchMedicines = (token) => {
  return axios.get(`${API_BASE_URL}/medicines`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Add medicine
export const addMedicine = (data, token) => {
  return axios.post(`${API_BASE_URL}/medicines`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Fetch chatbot response
export const sendChatMessage = (message, userId, token) => {
  return axios.post(
    `${API_BASE_URL}/chatbot/message`,
    { message, userId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Send SOS alert
export const sendSOSAlert = (userId, location, token) => {
  return axios.post(
    `${API_BASE_URL}/sos/alert`,
    { userId, location },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
