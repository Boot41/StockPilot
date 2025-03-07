import axios from "axios";

const API_BASE_URL = "http://localhost:8000"; // Your Django backend URL

// Function to get CSRF token
export const getCSRFToken = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/csrf/`, {
      withCredentials: true,
    });
    return response.data.csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
};

// Function to login
export const login = async (username, password) => {
  const csrfToken = await getCSRFToken();
  if (!csrfToken) {
    console.error("CSRF token missing");
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login/`,
      { username, password },
      {
        withCredentials: true,
        headers: { "X-CSRFToken": csrfToken },
      }
    );
    console.log("Login successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
  }
};
