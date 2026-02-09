
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Directory from './pages/Directory';
import StudentProfile from './pages/StudentProfile';
import EditProfile from './pages/EditProfile';
import Resources from './pages/Resources';
import Notices from './pages/Notices';
import Submit from './pages/Submit';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Secure Admin Routes (No Layout) */}
        <Route path="/admin-portal-secure" element={<AdminLogin />} />
        <Route path="/admin-portal-secure/dashboard" element={<AdminDashboard />} />

        {/* Public Routes (Wrapped in Layout) */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/directory/:slug" element={<StudentProfile />} />
                <Route path="/edit-profile/:slug" element={<EditProfile />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/notices" element={<Notices />} />
                <Route path="/submit" element={<Submit />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
