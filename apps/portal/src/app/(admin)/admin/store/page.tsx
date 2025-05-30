import { redirect } from "next/navigation";

export default function StoreRedirect() {
  redirect("/admin/products");
}
