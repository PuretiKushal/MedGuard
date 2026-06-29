import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FacilityLayout from "./components/FacilityLayout";
import PatientLayout from "./components/PatientLayout";

import Dashboard from "./pages/facility/Dashboard";
import Inventory from "./pages/facility/Inventory";
import InvoiceUpload from "./pages/facility/InvoiceUpload";
import Alerts from "./pages/facility/Alerts";
import Intelligence from "./pages/facility/Intelligence";
import Profile from "./pages/facility/Profile";

import PatientSearch from "./pages/patient/PatientSearch";
import BrowseCategories from "./pages/patient/BrowseCategories";
import FacilitiesDirectory from "./pages/patient/FacilitiesDirectory";
import FacilityDetail from "./pages/patient/FacilityDetail";
import MyNotifications from "./pages/patient/MyNotifications";

import AdminVerify from "./pages/admin/AdminVerify";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient portal */}
          <Route path="/search" element={<PatientLayout />}>
            <Route index element={<PatientSearch />} />
            <Route path="browse" element={<BrowseCategories />} />
            <Route path="facilities" element={<FacilitiesDirectory />} />
            <Route path="facility/:id" element={<FacilityDetail />} />
            <Route path="notifications" element={<MyNotifications />} />
          </Route>

          {/* Facility (protected) */}
          <Route path="/facility" element={<FacilityLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="invoice" element={<InvoiceUpload />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="intelligence" element={<Intelligence />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/verify-facilities" element={<AdminVerify />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
