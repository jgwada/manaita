export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-[#9A8880] text-sm">{message}</p>
    </div>
  )
}
