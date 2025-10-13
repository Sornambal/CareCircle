import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Adjust if backend runs on different host/port

// User registration
export const registerUser = (data) => {
  return axios.post(`${API_BASE_URL}/auth/register`, data);
};

// User login (legacy)
export const loginUser = (data) => {
  return axios.post(`${API_BASE_URL}/auth/login`, data);
};

// Login
export const login = (data) => {
  return axios.post(`${API_BASE_URL}/auth/login`, data);
};

// Caregiver login
export const caregiverLogin = (data) => {
  return axios.post(`${API_BASE_URL}/auth/login`, data);
};

// Fetch medicines for user
export const fetchMedicines = (token) => {
  return axios.get(`${API_BASE_URL}/medicines`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Fetch today's medicines for user
export const getTodaysMedicines = (token) => {
  return axios.get(`${API_BASE_URL}/medicines/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Add medicine
export const addMedicine = (data, token) => {
  return axios.post(`${API_BASE_URL}/medicines`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Update medicine
export const updateMedicine = (id, data, token) => {
  return axios.put(`${API_BASE_URL}/medicines/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Delete medicine
export const deleteMedicine = (id, token) => {
  return axios.delete(`${API_BASE_URL}/medicines/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Mark medicine as taken
export const markMedicineTaken = (medicineId, data, token) => {
  return axios.put(`${API_BASE_URL}/medicines/${medicineId}/taken`, data, {
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
export const sendSOSAlert = (userId, location, token, type = 'emergency') => {
  return axios.post(
    `${API_BASE_URL}/sos/alert`,
    { location, type },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Get emergency contacts
export const getEmergencyContacts = (token) => {
  return axios.get(`${API_BASE_URL}/emergency-contacts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Add emergency contact
export const addEmergencyContact = (data, token) => {
  return axios.post(`${API_BASE_URL}/emergency-contacts`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Update emergency contact
export const updateEmergencyContact = (id, data, token) => {
  return axios.put(`${API_BASE_URL}/emergency-contacts/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Delete emergency contact
export const deleteEmergencyContact = (id, token) => {
  return axios.delete(`${API_BASE_URL}/emergency-contacts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
