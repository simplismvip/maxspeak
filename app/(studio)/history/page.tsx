export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-2xl font-semibold">生成历史</h1>
      <p className="mt-3 text-sm text-[rgb(var(--muted-foreground))]">
        登录和计费接通后，这里会保存每次合成任务、播放链接和任务 ID。当前仍使用本地播放器记录。
      </p>
    </div>
  );
}