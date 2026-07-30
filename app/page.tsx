import { Baby } from "lucide-react";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

/**
 * 初期構築確認用のプレースホルダー画面。
 * 認証・ホーム・クイック記録などの主要画面 UI は未実装（次フェーズ）。
 */
export default function RootPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="app-max-width flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <div
          className="flex size-20 items-center justify-center rounded-3xl bg-primary/25 shadow-soft"
          aria-hidden
        >
          <Baby className="size-10 text-primary-foreground" strokeWidth={1.75} />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {APP_NAME}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {APP_DESCRIPTION}
          </p>
        </div>
        <div className="w-full rounded-2xl bg-card p-5 text-left shadow-soft">
          <p className="text-sm font-medium text-foreground">初期構築完了</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Next.js / Tailwind / shadcn/ui / デザインシステムの骨格まで準備済みです。
            主要画面の UI 実装は次のステップで進めます。
          </p>
        </div>
        <div className="flex w-full flex-wrap justify-center gap-2">
          <span className="rounded-full bg-primary/30 px-3 py-2 text-xs font-medium text-primary-foreground">
            くすみピンク
          </span>
          <span className="rounded-full bg-secondary/50 px-3 py-2 text-xs font-medium text-secondary-foreground">
            ミント
          </span>
          <span className="rounded-full bg-accent/70 px-3 py-2 text-xs font-medium text-accent-foreground">
            イエロー
          </span>
        </div>
      </main>
    </div>
  );
}
