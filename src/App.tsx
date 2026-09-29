import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";

// Lazy-load everything except the three public/priority routes
const NotFound = lazy(() => import("./pages/NotFound"));
const Forbidden = lazy(() => import("./pages/Forbidden"));
const CreateMetrics = lazy(() => import("./pages/CreateMetrics"));
const MetricsHistory = lazy(() => import("./pages/MetricsHistory"));
const Companies = lazy(() => import("./pages/Companies"));
const SupportGroups = lazy(() => import("./pages/SupportGroups"));
const Sites = lazy(() => import("./pages/Sites"));
const ProductCategories = lazy(() => import("./pages/ProductCategories"));
const Services = lazy(() => import("./pages/Services"));
const BusinessHours = lazy(() => import("./pages/BusinessHours"));
const Clusters = lazy(() => import("./pages/Clusters"));
const MttrPresets = lazy(() => import("./pages/MttrPresets"));
const ImportHistory = lazy(() => import("./pages/ImportHistory"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Users = lazy(() => import("./pages/Users"));
const SupportGroupCompanies = lazy(
  () => import("./pages/SupportGroupCompanies")
);
const SupportOrganizations = lazy(() => import("./pages/SupportOrganizations"));

function Loading() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      Loading…
    </div>
  );
}

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Authenticated routes */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          {/* Dashboard */}
          <Route
            path="dashboard"
            element={
              <SuspenseWrap>
                <Home />
              </SuspenseWrap>
            }
          />

          {/* Operations */}
          <Route
            path="create"
            element={
              <SuspenseWrap>
                <CreateMetrics />
              </SuspenseWrap>
            }
          />
          <Route
            path="history"
            element={
              <SuspenseWrap>
                <MetricsHistory />
              </SuspenseWrap>
            }
          />
          <Route
            path="notifications"
            element={
              <SuspenseWrap>
                <Notifications />
              </SuspenseWrap>
            }
          />

          {/* Configuration — Admin or Editor */}
          <Route element={<RequireRole role="editor" />}>
            <Route path="companies" element={<SuspenseWrap><Companies /></SuspenseWrap>} />
            <Route path="sg-companies" element={<SuspenseWrap><SupportGroupCompanies /></SuspenseWrap>} />
            <Route path="support-orgs" element={<SuspenseWrap><SupportOrganizations /></SuspenseWrap>} />
            <Route path="groups" element={<SuspenseWrap><SupportGroups /></SuspenseWrap>} />
            <Route path="sites" element={<SuspenseWrap><Sites /></SuspenseWrap>} />
            <Route path="products" element={<SuspenseWrap><ProductCategories /></SuspenseWrap>} />
            <Route path="services" element={<SuspenseWrap><Services /></SuspenseWrap>} />
            <Route path="bhours" element={<SuspenseWrap><BusinessHours /></SuspenseWrap>} />
            <Route path="clusters" element={<SuspenseWrap><Clusters /></SuspenseWrap>} />
            <Route path="mttrs" element={<SuspenseWrap><MttrPresets /></SuspenseWrap>} />
          </Route>

          {/* Administration — Admin only */}
          <Route element={<RequireRole role="admin" />}>
            <Route path="users" element={<SuspenseWrap><Users /></SuspenseWrap>} />
            <Route path="import-history" element={<SuspenseWrap><ImportHistory /></SuspenseWrap>} />
            <Route path="audit" element={<SuspenseWrap><AuditLog /></SuspenseWrap>} />
          </Route>

          <Route path="forbidden" element={<SuspenseWrap><Forbidden /></SuspenseWrap>} />
          <Route path="*" element={<SuspenseWrap><NotFound /></SuspenseWrap>} />
        </Route>
      </Route>
    </Routes>
  );
}