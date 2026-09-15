import ConfigPage from "../components/ui/ConfigPage";
import { sitesSpec, type Site } from "../configs/sites";
export default function Sites() {
  return <ConfigPage<Site> spec={sitesSpec} />;
}