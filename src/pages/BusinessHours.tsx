import ConfigPage from "../components/ui/ConfigPage";
import { businessHoursSpec, type BusinessHours as BH } from "../configs/businessHours";
export default function BusinessHours() {
  return <ConfigPage<BH> spec={businessHoursSpec} />;
}