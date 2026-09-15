import ConfigPage from "../components/ui/ConfigPage";
import { supportGroupsSpec, type SupportGroup } from "../configs/supportGroups";
export default function SupportGroups() {
  return <ConfigPage<SupportGroup> spec={supportGroupsSpec} />;
}