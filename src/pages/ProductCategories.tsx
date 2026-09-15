import ConfigPage from "../components/ui/ConfigPage";
import { productCategoriesSpec, type ProductCategory } from "../configs/productCategories";
export default function ProductCategories() {
  return <ConfigPage<ProductCategory> spec={productCategoriesSpec} />;
}