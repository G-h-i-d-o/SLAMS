import ConfigPage from "../components/ui/ConfigPage";
import { mttrPresetsSpec, type MttrPreset } from "../configs/mttrPresets";
export default function MttrPresets() {
  return <ConfigPage<MttrPreset> spec={mttrPresetsSpec} />;
}