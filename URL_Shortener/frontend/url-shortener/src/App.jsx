import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import Shortener from "./Shortener";

function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to handle initial render

  // Check if the token exists in localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
    setLoading(false); // Set loading to false once token is checked
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
    // Save the token to localStorage
    localStorage.setItem("token", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token"); // Remove the token from localStorage
  };

  const ProtectedRoute = ({ children }) => {
    // If loading, show a loading indicator or nothing
    if (loading) return <div>Loading...</div>;

    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/shorten"
          element={
            <ProtectedRoute>
              <Shortener token={token} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
