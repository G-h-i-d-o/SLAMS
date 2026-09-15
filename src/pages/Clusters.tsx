import ConfigPage from "../components/ui/ConfigPage";
import { clustersSpec, type Cluster } from "../configs/clusters";
export default function Clusters() {
  return <ConfigPage<Cluster> spec={clustersSpec} />;
}