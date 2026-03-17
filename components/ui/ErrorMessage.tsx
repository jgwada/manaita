export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
      <p className="text-sm text-[#E8320A]">{message}</p>
    </div>
  )
}
