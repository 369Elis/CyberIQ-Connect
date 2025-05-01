import React, { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { getProgress } from "../api";
// Remove the ProtectedRoute import (not needed here)
// Fix malware components import path
import {
  Virus,
  Worm,
  Trojan,
  Keylogger,
  Ransomware,
  Backdoor,
  Rootkit,
  BotBotnet,
  BotnetCommandAndControl,
  AdwareSpyware,
  LogicBomb,
  AdvancedMalwareAnalysis,
  AdvancedRootkitAnalysis,
} from "./Learn/Malware/MalwarePages"; // Changed path

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Malware pages */}
          <Route
            path="/learn/malware/virus"
            element={
              <ProtectedRoute>
                <Virus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/malware/worm"
            element={
              <ProtectedRoute>
                <Worm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/malware/trojan"
            element={
              <ProtectedRoute>
                <Trojan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/malware/keylogger"
            element={
              <ProtectedRoute>
                <Keylogger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/malware/ransomware"
            element={
              <ProtectedRoute>
                <Ransomware />
              </ProtectedRoute>
            }
          />
          {/* Add similar protection for all other routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
