import ConfigPage from "../components/ui/ConfigPage";
import {
  supportGroupCompaniesSpec,
  type SupportGroupCompany,
} from "../configs/supportGroupCompanies";

export default function SupportGroupCompanies() {
  return <ConfigPage<SupportGroupCompany> spec={supportGroupCompaniesSpec} />;
}