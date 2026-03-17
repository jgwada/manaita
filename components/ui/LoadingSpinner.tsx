export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="w-8 h-8 border-4 border-[#E8320A] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[#9A8880]">生成中...</p>
    </div>
  )
}
