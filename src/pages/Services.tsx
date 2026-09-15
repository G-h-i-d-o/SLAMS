import ConfigPage from "../components/ui/ConfigPage";
import { servicesSpec, type Service } from "../configs/services";
export default function Services() {
  return <ConfigPage<Service> spec={servicesSpec} />;
}