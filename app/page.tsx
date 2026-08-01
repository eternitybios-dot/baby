"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/LoadingState";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home/");
  }, [router]);

  return (
    <div className="app-max-width px-4 pt-8">
      <LoadingState label="ホームへ移動中" rows={2} />
    </div>
  );
}
