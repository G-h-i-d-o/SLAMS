import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import CreateMetrics from "./pages/CreateMetrics";
import MetricsHistory from "./pages/MetricsHistory";
import Companies from "./pages/Companies";
import SupportGroups from "./pages/SupportGroups";
import Sites from "./pages/Sites";
import ProductCategories from "./pages/ProductCategories";
import Services from "./pages/Services";
import BusinessHours from "./pages/BusinessHours";
import Clusters from "./pages/Clusters";
import MttrPresets from "./pages/MttrPresets";
import ImportHistory from "./pages/ImportHistory";
import AuditLog from "./pages/AuditLog";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import SupportGroupCompanies from "./pages/SupportGroupCompanies";
import SupportOrganizations from "./pages/SupportOrganizations";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          {/* Operations — everyone */}
          <Route index element={<Home />} />
          <Route path="create" element={<CreateMetrics />} />
          <Route path="history" element={<MetricsHistory />} />
          <Route path="notifications" element={<Notifications />} />

          {/* Configuration — Admin or Editor */}
          <Route element={<RequireRole role="editor" />}>
            <Route path="companies" element={<Companies />} />
            <Route path="sg-companies" element={<SupportGroupCompanies />} />
            <Route path="support-orgs" element={<SupportOrganizations />} />
            <Route path="groups" element={<SupportGroups />} />
            <Route path="sites" element={<Sites />} />
            <Route path="products" element={<ProductCategories />} />
            <Route path="services" element={<Services />} />
            <Route path="bhours" element={<BusinessHours />} />
            <Route path="clusters" element={<Clusters />} />
            <Route path="mttrs" element={<MttrPresets />} />
          </Route>

          {/* Administration — Admin only */}
          <Route element={<RequireRole role="admin" />}>
            <Route path="users" element={<Users />} />
            <Route path="import-history" element={<ImportHistory />} />
            <Route path="audit" element={<AuditLog />} />
          </Route>

          <Route path="forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}