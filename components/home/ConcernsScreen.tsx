import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { fetchConcerns } from "@/lib/data/queries";
import { loadViewData } from "@/lib/data/load";
import type { ConcernStatus } from "@/types/domain";
import { formatClock, formatDisplayDate } from "@/lib/format";

const STATUS_LABEL: Record<ConcernStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  watching: "様子見",
  resolved: "解決",
};

export async function ConcernsScreen() {
  const state = await loadViewData(() => fetchConcerns());
  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  const items = state.data;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">困り事</h1>
        <p className="text-sm text-muted-foreground">
          気になることと対応を家族で共有
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="困り事はまだありません"
          description="ぐずりや肌荒れなど、気になることを残しておくと振り返りやすくなります"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category} ／ 程度 {item.severity}/5
                  </p>
                </div>
                <Badge variant="secondary">{STATUS_LABEL[item.status]}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {item.body}
              </p>
              {item.actionTaken ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  対応: {item.actionTaken}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">
                {formatDisplayDate(item.occurredAt)} {formatClock(item.occurredAt)}{" "}
                ／ {item.recorder.displayName}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
