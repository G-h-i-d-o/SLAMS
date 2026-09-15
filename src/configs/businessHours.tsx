import type { ConfigSpec } from "../types/config";

export type BusinessHours = {
  id: string;
  external_id: string;
  label: string;
  schedule: string;
  is_enabled: boolean;
};

export const businessHoursSpec: ConfigSpec<BusinessHours> = {
  table: "business_hours",
  title: "Business Hours",
  subtitle: "Working-hour calendars",
  orderBy: "label",
  columns: [
    {
      key: "external_id",
      label: "External ID",
      render: (r) => <span className="cell-id">{r.external_id}</span>,
    },
    { key: "label", label: "Label", render: (r) => <span className="cell-strong">{r.label}</span> },
    { key: "schedule", label: "Schedule" },
    {
      key: "is_enabled",
      label: "Status",
      render: (r) =>
        r.is_enabled ? (
          <span className="badge badge-success">Enabled</span>
        ) : (
          <span className="badge badge-neutral">Disabled</span>
        ),
    },
  ],
  fields: [
    { key: "label", label: "Label", type: "text", required: true, full: true, hint: 'e.g. "24 × 7" or "08h00-16h30"' },
    { key: "schedule", label: "Schedule", type: "text", required: true, full: true, hint: 'e.g. "Mon-Fri 08:00-16:30"' },
    { key: "is_enabled", label: "Enabled", type: "checkbox", default: true },
  ],
};