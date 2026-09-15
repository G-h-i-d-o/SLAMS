import type { ImportSpec } from "../../types/config";

/** Case-insensitive name → id resolver factory. */
function resolveByName<T extends { id: string; name: string }>(
  list: T[]
): (rawValue: string) => string | null | undefined {
  return (rawValue) => {
    const v = rawValue.toLowerCase().trim();
    if (!v) return undefined;
    const hit = list.find((x) => x.name.toLowerCase() === v);
    return hit?.id ?? null;
  };
}

export const importSpecs = {
  companies: {
    table: "companies",
    title: "Companies",
    columns: [
      {
        key: "name",
        label: "Company Name",
        required: true,
        aliases: ["name", "company", "company name", "companyname", "customer"],
      },
      {
        key: "customer_number",
        label: "Customer Number",
        aliases: ["customer number", "customer_number", "customernumber", "cust no", "customer no"],
      },
    ],
    sample: { "Company Name": "Northwind Systems", "Customer Number": "9999" },
  } as ImportSpec,

  groups: {
    table: "support_groups",
    title: "Support Groups",
    columns: [
      {
        key: "name",
        label: "Support Group Name",
        required: true,
        aliases: ["name", "support group", "support group name", "group", "group name"],
      },
      {
        key: "support_organization_id",
        label: "Support Organization",
        required: true,
        aliases: ["support organization", "support org", "organization", "org", "support company"],
        resolve: (v, l) => resolveByName(l.supportOrganizations)(v),
        resolveHint: "Must match an existing Support Organization name",
      },
    ],
    sample: { "Support Group Name": "Tier 1 Service Desk", "Support Organization": "Global Services" },
  } as ImportSpec,

  sites: {
    table: "sites",
    title: "Sites",
    columns: [
      {
        key: "name",
        label: "Site Name",
        required: true,
        aliases: ["name", "site", "site name", "sitename", "location"],
      },
      {
        key: "company_id",
        label: "Company",
        required: true,
        aliases: ["company", "company name", "customer", "customer name"],
        resolve: (v, l) => resolveByName(l.companies)(v),
        resolveHint: "Must match an existing Company name",
      },
    ],
    sample: {
      "Site Name": "Head Office",
      Company: "NAT Dept of Women, Youth and Persons with Disabilities",
    },
  } as ImportSpec,

  products: {
    table: "product_categories",
    title: "Product Categories",
    columns: [
      {
        key: "tier1",
        label: "Product Tier 1",
        required: true,
        aliases: ["tier1", "tier 1", "product tier1", "product tier 1", "producttier1"],
      },
      {
        key: "tier2",
        label: "Product Tier 2",
        aliases: ["tier2", "tier 2", "product tier2", "product tier 2", "producttier2"],
      },
      {
        key: "tier3",
        label: "Product Tier 3",
        aliases: ["tier3", "tier 3", "product tier3", "product tier 3", "producttier3"],
      },
      {
        key: "product_name",
        label: "Product Name",
        required: true,
        aliases: ["product", "product name", "productname"],
      },
      {
        key: "company_id",
        label: "Company (optional)",
        aliases: ["company", "company name"],
        resolve: (v, l) => {
          const lower = v.toLowerCase().trim();
          if (!lower || lower === "global") return undefined;
          return resolveByName(l.companies)(v);
        },
        resolveHint: "Leave blank for a Global product",
      },
    ],
    sample: {
      "Product Tier 1": "Infrastructure",
      "Product Tier 2": "Compute",
      "Product Tier 3": "Virtual Machines",
      "Product Name": "VM-Standard",
      Company: "",
    },
  } as ImportSpec,
};