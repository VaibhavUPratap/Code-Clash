import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import AlertsPage from "./pages/AlertsPage";
import InsightsPage from "./pages/InsightsPage";
import PredictionPage from "./pages/PredictionPage";
import DeepResearchPage from "./pages/DeepResearchPage";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/research" element={<DeepResearchPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
