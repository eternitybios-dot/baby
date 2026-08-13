"use client";

import { useState } from "react";
import {
  Baby,
  Bell,
  Copy,
  Eraser,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/components/providers/AppDataProvider";
import { APP_NAME } from "@/lib/constants";
import {
  getNotificationPermission,
  isNotificationSupported,
  isPushManagerSupported,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function SettingsScreen() {
  const {
    baby,
    state,
    currentUser,
    syncing,
    updateBaby,
    updateDisplayName,
    updateFamilyName,
    rotateInviteCode,
    leaveFamily,
    removeFamilyMember,
    resetServerConfig,
    notifyReady,
    notifyPermissionGranted,
    pushRegistered,
    enableDeviceNotifications,
    disableDeviceNotifications,
    sendTestDeviceNotification,
  } = useAppData();
  const [name, setName] = useState(baby.name);
  const [nickname, setNickname] = useState(baby.nickname ?? "");
  const [birthDate, setBirthDate] = useState(baby.birthDate);
  const [memo, setMemo] = useState(baby.memo ?? "");
  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const [familyNameDraft, setFamilyNameDraft] = useState<string | null>(null);
  const displayName = displayNameDraft ?? currentUser.displayName;
  const familyName = familyNameDraft ?? state.family.familyName;
  const notifySupported = isNotificationSupported();
  const pushSupported = isPushManagerSupported();
  const notifyPermission = getNotificationPermission();

  const babyFormKey = `${baby.id}:${baby.name}:${baby.birthDate}`;
  const [formKey, setFormKey] = useState(babyFormKey);
  if (formKey !== babyFormKey) {
    setFormKey(babyFormKey);
    setName(baby.name);
    setNickname(baby.nickname ?? "");
    setBirthDate(baby.birthDate);
    setMemo(baby.memo ?? "");
  }

  const familyNameKey = state.family.familyName;
  const [syncedFamilyNameKey, setSyncedFamilyNameKey] = useState(familyNameKey);
  if (syncedFamilyNameKey !== familyNameKey && familyNameDraft === null) {
    setSyncedFamilyNameKey(familyNameKey);
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">{APP_NAME}</p>
      </header>

      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <Bell className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">入力の通知</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          相手が授乳・睡眠・おむつ・困り事などを入力したとき、端末に通知します。
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          iPhone では Safari のタブではなく、
          <span className="font-medium text-foreground">
            ホーム画面に追加したアプリ
          </span>
          から開いた状態で、下のボタンを押してください（iOS 16.4以降）。
        </p>
        {!notifySupported ? (
          <p className="mt-3 text-sm text-muted-foreground">
            このブラウザは通知に対応していません。ホーム画面アプリから開いてください。
          </p>
        ) : !pushSupported ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Push
            通知に対応していません。Safariのタブではなく、ホーム画面アイコンから開いてください。
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              className={cn(
                "tap-target flex h-11 w-full items-center justify-center rounded-xl border text-sm font-medium",
                notifyReady
                  ? "border-primary bg-primary/30"
                  : "border-border bg-background",
              )}
              aria-pressed={notifyReady}
              onClick={async () => {
                if (notifyReady) {
                  await disableDeviceNotifications();
                  toast.message("通知をオフにしました");
                  return;
                }
                const result = await enableDeviceNotifications();
                if (result.ok) {
                  toast.success(result.detail ?? "通知をオンにしました");
                } else if (result.permissionGranted && !result.pushRegistered) {
                  toast.error(
                    result.detail ??
                      "端末通知は許可されましたが、相手からの通知設定は未完了です",
                  );
                } else {
                  toast.error(result.detail ?? "通知をオンにできませんでした");
                }
              }}
            >
              {notifyReady
                ? "通知オン（タップでオフ）"
                : "通知をオンにする（テスト通知あり）"}
            </button>
            {notifyPermissionGranted ? (
              <button
                type="button"
                className="tap-target flex h-11 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-medium"
                onClick={async () => {
                  const result = await sendTestDeviceNotification();
                  if (result.ok) toast.success(result.detail);
                  else toast.error(result.detail);
                }}
              >
                テスト通知を送る
              </button>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              iPhone ではアプリを開いたままだとバナーが出ないことがあります。テスト後に一度ホーム画面へ戻って確認してください。
            </p>
            {notifyPermissionGranted && !pushRegistered ? (
              <p className="text-xs text-destructive">
                端末の通知許可はできていますが、相手への配信設定がまだ完了していません。もう一度「通知をオン」を試すか、ホーム画面アイコンから開き直してください。直らない場合は管理者に通知サーバー設定を依頼してください。
              </p>
            ) : null}
            {notifyPermission === "denied" ? (
              <p className="text-xs text-destructive">
                通知が拒否されています。iPhoneの「設定」→「通知」→「すくすくログ」で許可してください。
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <Users className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">家族の共有</h2>
        </div>
        <div className="space-y-1">
          <Label htmlFor="familyName">家族の名前</Label>
          <div className="flex items-center gap-2">
            <Input
              id="familyName"
              className="h-11 flex-1"
              value={familyName}
              placeholder="未設定"
              disabled={syncing}
              onChange={(e) => setFamilyNameDraft(e.target.value)}
              aria-label="家族の名前"
            />
            <Button
              type="button"
              variant="outline"
              className="tap-target h-11 shrink-0"
              disabled={syncing || !familyName}
              aria-label="家族の名前を消す"
              onClick={async () => {
                try {
                  setFamilyNameDraft("");
                  await updateFamilyName("");
                  setFamilyNameDraft(null);
                  toast.success("家族の名前を消しました");
                } catch {
                  setFamilyNameDraft(null);
                }
              }}
            >
              <Eraser className="size-4" />
            </Button>
          </div>
          {familyNameDraft !== null &&
          familyNameDraft.trim() !== state.family.familyName ? (
            <Button
              type="button"
              variant="outline"
              className="tap-target mt-2 h-11 w-full"
              disabled={syncing}
              onClick={async () => {
                try {
                  await updateFamilyName(familyNameDraft);
                  setFamilyNameDraft(null);
                  toast.success(
                    familyNameDraft.trim()
                      ? "家族の名前を保存しました"
                      : "家族の名前を消しました",
                  );
                } catch {
                  /* runRemote 側で toast */
                }
              }}
            >
              家族の名前を保存
            </Button>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          相手の端末でも同じ招待コードで参加すると、記録がサーバー経由で共有されます。
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-border bg-background px-3 py-2">
            <p className="text-[11px] text-muted-foreground">招待コード</p>
            <p className="font-mono text-lg tracking-[0.18em]">
              {state.family.inviteCode || "------"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="tap-target h-11 shrink-0"
            aria-label="招待コードをコピー"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.family.inviteCode);
                toast.success("招待コードをコピーしました");
              } catch {
                toast.error("コピーできませんでした");
              }
            }}
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          招待コードはパスワードと同じです。期限は再発行から30日です。
        </p>
        <Button
          type="button"
          variant="outline"
          className="tap-target mt-2 h-11 w-full"
          disabled={syncing}
          onClick={async () => {
            try {
              await rotateInviteCode();
              toast.success("招待コードを再発行しました");
            } catch {
              /* runRemote */
            }
          }}
        >
          招待コードを再発行
        </Button>
        <ul className="mt-3 space-y-1 text-sm">
          {state.family.members.map((member) => {
            const isSelf = member.id === currentUser.id;
            const roleLabel = isSelf
              ? "この端末"
              : member.role === "owner"
                ? "作成者"
                : "メンバー";
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 truncate">
                  {member.displayName || "（名前なし）"}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {roleLabel}
                  </span>
                  {!isSelf ? (
                    <button
                      type="button"
                      className="tap-target flex size-9 items-center justify-center rounded-full text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50"
                      disabled={syncing}
                      aria-label={`${member.displayName || "メンバー"}を家族から外す`}
                      onClick={async () => {
                        const name = member.displayName || "このメンバー";
                        const message =
                          member.role === "owner"
                            ? `${name}（作成者）を家族から外しますか？この端末が作成者になります。`
                            : `${name}を家族から外しますか？`;
                        if (!window.confirm(message)) return;
                        try {
                          await removeFamilyMember(member.id);
                          toast.success(
                            member.role === "owner"
                              ? "作成者を外しました"
                              : "メンバーを外しました",
                          );
                        } catch {
                          /* runRemote 側で toast */
                        }
                      }}
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="text-sm font-medium text-muted-foreground">
          あなたの表示名
        </h2>
        <div className="flex items-center gap-2">
          <Input
            className="h-11 flex-1"
            value={displayName}
            placeholder="未設定"
            onChange={(e) => setDisplayNameDraft(e.target.value)}
            aria-label="表示名"
          />
          <Button
            type="button"
            variant="outline"
            className="tap-target h-11 shrink-0"
            disabled={syncing || !displayName}
            aria-label="表示名を消す"
            onClick={async () => {
              try {
                setDisplayNameDraft("");
                await updateDisplayName("");
                setDisplayNameDraft(null);
                toast.success("表示名を消しました");
              } catch {
                setDisplayNameDraft(null);
              }
            }}
          >
            <Eraser className="size-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          className="tap-target h-11 w-full"
          disabled={syncing}
          onClick={async () => {
            try {
              await updateDisplayName(displayName);
              setDisplayNameDraft(null);
              toast.success(
                displayName.trim()
                  ? "表示名を保存しました"
                  : "表示名を消しました",
              );
            } catch {
              /* runRemote 側で toast */
            }
          }}
        >
          表示名を保存
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Baby className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">赤ちゃん情報</h2>
        </div>
        <div className="space-y-1">
          <Label htmlFor="babyName">名前</Label>
          <Input
            id="babyName"
            className="h-11"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="babyNickname">ニックネーム</Label>
          <Input
            id="babyNickname"
            className="h-11"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="babyBirth">生年月日</Label>
          <Input
            id="babyBirth"
            type="date"
            className="h-11"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="babyMemo">メモ</Label>
          <Input
            id="babyMemo"
            className="h-11"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="tap-target h-11 w-full"
          aria-label="赤ちゃん情報を保存"
          disabled={syncing}
          onClick={() => {
            if (!name.trim() || !birthDate) {
              toast.error("名前と生年月日は必須です");
              return;
            }
            updateBaby({
              name: name.trim(),
              nickname: nickname.trim() || null,
              birthDate,
              memo: memo.trim() || null,
              avatarUrl: null,
            });
            toast.success("赤ちゃん情報を保存しました");
          }}
        >
          保存する
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="text-sm font-medium text-muted-foreground">この端末</h2>
        <p className="text-xs text-muted-foreground">
          家族から退出すると、この端末の記録画面は初期状態に戻ります。招待コードがあれば再参加できます。
        </p>
        <Button
          type="button"
          variant="outline"
          className="tap-target h-11 w-full"
          disabled={syncing}
          onClick={async () => {
            if (!window.confirm("この端末を家族から退出しますか？")) return;
            try {
              await leaveFamily();
              toast.success("家族から退出しました");
            } catch {
              /* runRemote */
            }
          }}
        >
          家族から退出する
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="tap-target h-11 w-full text-muted-foreground"
          onClick={() => {
            if (!window.confirm("サーバー設定を消して最初から接続し直しますか？")) {
              return;
            }
            resetServerConfig();
            toast.message("サーバー設定をリセットしました");
          }}
        >
          サーバー設定をやり直す
        </Button>
      </section>
    </div>
  );
}
