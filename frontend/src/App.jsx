import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

import Login from "./pages/Login";
import FacilityLayout from "./components/FacilityLayout";
import Dashboard from "./pages/facility/Dashboard";
import Inventory from "./pages/facility/Inventory";
import InvoiceUpload from "./pages/facility/InvoiceUpload";
import Alerts from "./pages/facility/Alerts";
import Intelligence from "./pages/facility/Intelligence";
import PatientSearch from "./pages/patient/PatientSearch";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public patient portal */}
          <Route path="/" element={<PatientSearch />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Facility (protected) */}
          <Route path="/facility" element={<FacilityLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="invoice" element={<InvoiceUpload />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="intelligence" element={<Intelligence />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
