import ConfigPage from "../components/ui/ConfigPage";
import { companiesSpec, type Company } from "../configs/companies";
export default function Companies() {
  return <ConfigPage<Company> spec={companiesSpec} />;
}