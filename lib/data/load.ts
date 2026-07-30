import type { ReactNode } from "react";

type LoadState<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string };

async function toLoadState<T>(promise: Promise<T>): Promise<LoadState<T>> {
  try {
    return { status: "success", data: await promise };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "データの取得に失敗しました",
    };
  }
}

export async function loadViewData<T>(
  loader: () => Promise<T>,
): Promise<LoadState<T>> {
  return toLoadState(loader());
}

export type { LoadState };

export function mapLoadState<T>(
  state: LoadState<T>,
  render: (data: T) => ReactNode,
  renderError: (message: string) => ReactNode,
): ReactNode {
  if (state.status === "error") return renderError(state.message);
  return render(state.data);
}
