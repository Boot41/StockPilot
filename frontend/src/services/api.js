const api = {
    startTrial: async () => {
        // Placeholder for starting a trial
        console.log('Trial started');
    },
    login: async (username, password, csrfToken) => {
        try {
            const response = await axios.post("http://localhost:8000/auth/login/", {
                username,
                password
            }, {
                headers: {
                    'X-CSRFToken': csrfToken // Include CSRF token
                }
            });
            return response.data; // Ensure this returns the expected data
        } catch (error) {
            throw new Error(error.response?.data?.detail || "Login failed");
        }
    }
};

export default api;
