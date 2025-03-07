import React, { useEffect } from "react";
import axios from "axios";

const CSRFComponent = () => {
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await axios.get("http://localhost:8000/auth/csrf/", {
          withCredentials: true,
        });
        console.log("CSRF Token:", response.data);
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
      }
    };

    fetchCSRFToken();
  }, []);

  return <div>CSRF token fetched. Check your console for details.</div>;
};

export default CSRFComponent;
