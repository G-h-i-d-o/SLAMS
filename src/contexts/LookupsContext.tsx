import { createContext, useContext, useMemo, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { listRows } from "../lib/api";
import { useAuth } from "./AuthContext";
import type { Lookups } from "../types/config";

type CompanyRow = { id: string; name: string; external_id: string };
type SupportOrgRow = { id: string; name: string };

const LookupsContext = createContext<Lookups>({
  companies: [],
  supportOrganizations: [],
  companyNameById: {},
  supportOrgNameById: {},
});

export function LookupsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const enabled = !!user;

  const companiesQ = useQuery({
    queryKey: ["lookups", "companies"],
    queryFn: () => listRows<CompanyRow>("companies", "name"),
    enabled,
  });
  const orgsQ = useQuery({
    queryKey: ["lookups", "support_organizations"],
    queryFn: () => listRows<SupportOrgRow>("support_organizations", "name"),
    enabled,
  });

  const value: Lookups = useMemo(() => {
    const companies = companiesQ.data ?? [];
    const supportOrganizations = orgsQ.data ?? [];
    return {
      companies,
      supportOrganizations,
      companyNameById: Object.fromEntries(companies.map((c) => [c.id, c.name])),
      supportOrgNameById: Object.fromEntries(supportOrganizations.map((o) => [o.id, o.name])),
    };
  }, [companiesQ.data, orgsQ.data]);

  return <LookupsContext.Provider value={value}>{children}</LookupsContext.Provider>;
}

export function useLookups() {
  return useContext(LookupsContext);
}