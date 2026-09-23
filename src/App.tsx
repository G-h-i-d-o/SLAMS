import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import Login from "./pages/Login";
import Home from "./pages/Home";

// Lazy-load everything except Login and Home so the initial bundle is small
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
const SupportGroupCompanies = lazy(() => import("./pages/SupportGroupCompanies"));
const SupportOrganizations = lazy(() => import("./pages/SupportOrganizations"));

function Loading() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <Home />
              </Suspense>
            }
          />

          <Route element={<RequireRole role="editor" />}>
            <Route path="companies" element={<Suspense fallback={<Loading />}><Companies /></Suspense>} />
            <Route path="sg-companies" element={<Suspense fallback={<Loading />}><SupportGroupCompanies /></Suspense>} />
            <Route path="support-orgs" element={<Suspense fallback={<Loading />}><SupportOrganizations /></Suspense>} />
            <Route path="groups" element={<Suspense fallback={<Loading />}><SupportGroups /></Suspense>} />
            <Route path="sites" element={<Suspense fallback={<Loading />}><Sites /></Suspense>} />
            <Route path="products" element={<Suspense fallback={<Loading />}><ProductCategories /></Suspense>} />
            <Route path="services" element={<Suspense fallback={<Loading />}><Services /></Suspense>} />
            <Route path="bhours" element={<Suspense fallback={<Loading />}><BusinessHours /></Suspense>} />
            <Route path="clusters" element={<Suspense fallback={<Loading />}><Clusters /></Suspense>} />
            <Route path="mttrs" element={<Suspense fallback={<Loading />}><MttrPresets /></Suspense>} />
          </Route>

          <Route element={<RequireRole role="admin" />}>
            <Route path="users" element={<Suspense fallback={<Loading />}><Users /></Suspense>} />
            <Route path="import-history" element={<Suspense fallback={<Loading />}><ImportHistory /></Suspense>} />
            <Route path="audit" element={<Suspense fallback={<Loading />}><AuditLog /></Suspense>} />
          </Route>

          <Route path="create" element={<Suspense fallback={<Loading />}><CreateMetrics /></Suspense>} />
          <Route path="history" element={<Suspense fallback={<Loading />}><MetricsHistory /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<Loading />}><Notifications /></Suspense>} />
          <Route path="forbidden" element={<Suspense fallback={<Loading />}><Forbidden /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<Loading />}><NotFound /></Suspense>} />
        </Route>
      </Route>
    </Routes>
  );
}