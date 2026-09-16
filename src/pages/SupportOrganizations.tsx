import ConfigPage from "../components/ui/ConfigPage";
import {
  supportOrganizationsSpec,
  type SupportOrganization,
} from "../configs/supportOrganizations";

export default function SupportOrganizations() {
  return <ConfigPage<SupportOrganization> spec={supportOrganizationsSpec} />;
}