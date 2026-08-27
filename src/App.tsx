import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import Layout from '@/components/layout/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import GisPage from '@/pages/GisPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import CompensationPage from '@/pages/CompensationPage';
import PossessionPage from '@/pages/PossessionPage';
import FamiliesPage from '@/pages/FamiliesPage';
import RehabilitationPage from '@/pages/RehabilitationPage';
import ProposalsPage from '@/pages/ProposalsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AwardsPage from '@/pages/AwardsPage';
import AlertsPage from '@/pages/AlertsPage';
import WorkflowPage from '@/pages/WorkflowPage';
import SyncQueuePage from '@/pages/SyncQueuePage';
import ReportsPage from '@/pages/ReportsPage';
import DocumentsPage from '@/pages/DocumentsPage';
import LandParcelsPage from '@/pages/LandParcelsPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminRolesPage from '@/pages/admin/AdminRolesPage';
import AdminAuditPage from '@/pages/admin/AdminAuditPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminPwaPage from '@/pages/admin/AdminPwaPage';
import AdminHealthPage from '@/pages/admin/AdminHealthPage';

function ProtectedRoute({ module, children }: { module?: string; children: React.ReactNode }) {
  const { user, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (module && !hasPermission(module)) return <Navigate to="/dashboard" replace />;
  return <Layout module={module}>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute module="projects"><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute module="projects"><ProjectDetailPage /></ProtectedRoute>} />
          <Route path="/proposals" element={<ProtectedRoute module="proposals"><ProposalsPage /></ProtectedRoute>} />
          <Route path="/land-parcels" element={<ProtectedRoute module="parcels"><LandParcelsPage /></ProtectedRoute>} />
          <Route path="/gis" element={<ProtectedRoute module="gis"><GisPage /></ProtectedRoute>} />
          <Route path="/compensation" element={<ProtectedRoute module="compensation"><CompensationPage /></ProtectedRoute>} />
          <Route path="/possession" element={<ProtectedRoute module="possession"><PossessionPage /></ProtectedRoute>} />
          <Route path="/families" element={<ProtectedRoute module="families"><FamiliesPage /></ProtectedRoute>} />
          <Route path="/rehabilitation" element={<ProtectedRoute module="rehabilitation"><RehabilitationPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute module="notifications"><NotificationsPage /></ProtectedRoute>} />
          <Route path="/awards" element={<ProtectedRoute module="awards"><AwardsPage /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute module="alerts"><AlertsPage /></ProtectedRoute>} />
          <Route path="/workflow" element={<ProtectedRoute module="workflow"><WorkflowPage /></ProtectedRoute>} />
          <Route path="/sync-queue" element={<ProtectedRoute module="sync"><SyncQueuePage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute module="reports"><ReportsPage /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute module="documents"><DocumentsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute module="analytics"><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute module="admin-users"><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute module="admin-roles"><AdminRolesPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute module="audit"><AdminAuditPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute module="admin-settings"><AdminSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/pwa" element={<ProtectedRoute module="admin-pwa"><AdminPwaPage /></ProtectedRoute>} />
          <Route path="/admin/health" element={<ProtectedRoute module="admin-health"><AdminHealthPage /></ProtectedRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/health" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
