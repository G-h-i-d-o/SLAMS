import type { ConfigSpec } from "../types/config";

export type MttrPreset = {
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

export const mttrPresetsSpec: ConfigSpec<MttrPreset> = {
  table: "mttr_presets",
  title: "MTTR Presets",
  subtitle: "Response and resolve targets per priority",
  orderBy: "name",
  columns: [
    { key: "name", label: "Preset", render: (r) => <span className="cell-strong">{r.name}</span> },
    { key: "respond_critical", label: "Resp. Critical", align: "right" },
    { key: "resolve_critical", label: "Res. Critical", align: "right" },
    { key: "respond_high", label: "Resp. High", align: "right" },
    { key: "resolve_high", label: "Res. High", align: "right" },
    { key: "respond_medium", label: "Resp. Med", align: "right" },
    { key: "resolve_medium", label: "Res. Med", align: "right" },
    { key: "respond_low", label: "Resp. Low", align: "right" },
    { key: "resolve_low", label: "Res. Low", align: "right" },
  ],
  fields: [
    { key: "name", label: "Preset Name", type: "text", required: true, full: true },
    { key: "respond_critical", label: "Respond Critical (min)", type: "number", required: true, default: 0 },
    { key: "resolve_critical", label: "Resolve Critical (min)", type: "number", required: true, default: 0 },
    { key: "respond_high", label: "Respond High (min)", type: "number", required: true, default: 0 },
    { key: "resolve_high", label: "Resolve High (min)", type: "number", required: true, default: 0 },
    { key: "respond_medium", label: "Respond Medium (min)", type: "number", required: true, default: 0 },
    { key: "resolve_medium", label: "Resolve Medium (min)", type: "number", required: true, default: 0 },
    { key: "respond_low", label: "Respond Low (min)", type: "number", required: true, default: 0 },
    { key: "resolve_low", label: "Resolve Low (min)", type: "number", required: true, default: 0 },
  ],
};