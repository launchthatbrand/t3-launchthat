"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StoreProductsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/products");
  }, [router]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <p className="text-lg text-muted-foreground">
        Redirecting to Products...
      </p>
    </div>
  );
}
