import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { fetchHabits } from "@/lib/data/queries";
import { loadViewData } from "@/lib/data/load";

export async function HabitsScreen() {
  const state = await loadViewData(() => fetchHabits());
  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  const items = state.data;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">習慣・クセ</h1>
        <p className="text-sm text-muted-foreground">
          赤ちゃんのクセと効いた対応をメモ
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="習慣メモはまだありません"
          description="授乳前のサインや寝かしつけのコツを残しておきましょう"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category} ／ {item.frequency}
                  </p>
                </div>
                <Badge variant="secondary">
                  {item.status === "active" ? "有効" : "無効"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{item.body}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                出やすい時間帯: {item.likelyTimeOfDay}
              </p>
              {item.effectiveResponse ? (
                <p className="mt-1 text-sm text-foreground">
                  有効だった対応: {item.effectiveResponse}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                最終確認: {item.lastConfirmedAt ?? "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
