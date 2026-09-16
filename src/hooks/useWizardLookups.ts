import { useQuery } from "@tanstack/react-query";
import { listRows } from "../lib/api";

export type SupportGroupCompanyRow = {
  id: string;
  name: string;
  external_id: string;
};
export type CompanyRow = {
  id: string;
  external_id: string;
  name: string;
  customer_number: string | null;
};
export type SupportGroupRow = {
  id: string;
  name: string;
  support_organization_id: string;
};
export type SupportOrganizationRow = {
  id: string;
  name: string;
  support_group_company_id: string;
};
export type SiteRow = { id: string; name: string; company_id: string; is_enabled: boolean };
export type ProductRow = {
  id: string;
  company_id: string | null;
  tier1: string;
  tier2: string | null;
  tier3: string | null;
  product_name: string;
  is_enabled: boolean;
};
export type ServiceRow = {
  id: string;
  category: string;
  sub_category: string | null;
  component: string;
};
export type BusinessHoursRow = { id: string; label: string; is_enabled: boolean };
export type ClusterRow = { id: string; name: string; company_id: string; is_enabled: boolean };
export type MttrPresetRow = {
  id: string;
  name: string;
  respond_critical: number;
  resolve_critical: number;
  respond_high: number;
  resolve_high: number;
  respond_medium: number;
  resolve_medium: number;
  respond_low: number;
  resolve_low: number;
};

export function useWizardLookups() {
    const supportGroupCompanies = useQuery({
    queryKey: ["wiz", "support_group_companies"],
    queryFn: () => listRows<SupportGroupCompanyRow>("support_group_companies", "name"),
  });
  const companies = useQuery({
    queryKey: ["wiz", "companies"],
    queryFn: () => listRows<CompanyRow>("companies", "name"),
  });
  const supportGroups = useQuery({
    queryKey: ["wiz", "support_groups"],
    queryFn: () => listRows<SupportGroupRow>("support_groups", "name"),
  });
  const supportOrganizations = useQuery({
    queryKey: ["wiz", "support_organizations"],
    queryFn: () => listRows<SupportOrganizationRow>("support_organizations", "name"),
  });
  const sites = useQuery({
    queryKey: ["wiz", "sites"],
    queryFn: () => listRows<SiteRow>("sites", "name"),
  });
  const products = useQuery({
    queryKey: ["wiz", "products"],
    queryFn: () => listRows<ProductRow>("product_categories", "tier1"),
  });
  const services = useQuery({
    queryKey: ["wiz", "services"],
    queryFn: () => listRows<ServiceRow>("services", "category"),
  });
  const businessHours = useQuery({
    queryKey: ["wiz", "bhours"],
    queryFn: () => listRows<BusinessHoursRow>("business_hours", "label"),
  });
  const clusters = useQuery({
    queryKey: ["wiz", "clusters"],
    queryFn: () => listRows<ClusterRow>("clusters", "name"),
  });
  const mttrPresets = useQuery({
    queryKey: ["wiz", "mttr_presets"],
    queryFn: () => listRows<MttrPresetRow>("mttr_presets", "name"),
  });

  const loading =
    
    companies.isLoading ||
    supportGroups.isLoading ||
    supportOrganizations.isLoading ||
    sites.isLoading ||
    products.isLoading ||
    services.isLoading ||
    businessHours.isLoading ||
    clusters.isLoading ||
    mttrPresets.isLoading ||
    supportGroupCompanies.isLoading;

  return {
    companies: companies.data ?? [],
    supportGroupCompanies: supportGroupCompanies.data ?? [],
    supportGroups: supportGroups.data ?? [],
    supportOrganizations: supportOrganizations.data ?? [],
    sites: sites.data ?? [],
    products: products.data ?? [],
    services: services.data ?? [],
    businessHours: businessHours.data ?? [],
    clusters: clusters.data ?? [],
    mttrPresets: mttrPresets.data ?? [],
    loading,
  };
}

export type WizardLookups = ReturnType<typeof useWizardLookups>;