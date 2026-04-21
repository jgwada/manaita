'use client'

import { useEffect } from 'react'
import { Plus, MessageSquare, Trash2, X } from 'lucide-react'
import { useChatThreads } from '@/hooks/useChatThreads'
import { ChatMessage } from '@/types'

interface Props {
  shopId: string | undefined
  toolName: 'chat' | 'advisor' | 'manual' | 'banquet'
  currentThreadId: string | null
  onSelectThread: (threadId: string, messages: ChatMessage[]) => void
  onNewThread: () => void
  isOpen: boolean
  onClose: () => void
}

export default function ThreadSidebar({ shopId, toolName, currentThreadId, onSelectThread, onNewThread, isOpen, onClose }: Props) {
  const { threads, fetchThreads, loadThread, deleteThread } = useChatThreads(shopId, toolName)

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  const handleSelect = async (threadId: string) => {
    const messages = await loadThread(threadId)
    onSelectThread(threadId, messages)
    onClose()
  }

  const handleDelete = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation()
    if (!confirm('この相談を削除しますか？')) return
    await deleteThread(threadId)
    if (currentThreadId === threadId) onNewThread()
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed md:static top-14 md:top-0 bottom-0 left-0 z-40
        w-64 bg-white border-r border-[#E5E9F2] flex flex-col
        transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E9F2] flex-shrink-0">
          <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">過去の相談</span>
          <button onClick={onClose} className="md:hidden w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#111827]">
            <X size={14} />
          </button>
        </div>

        <div className="px-3 py-3 flex-shrink-0">
          <button
            onClick={() => { onNewThread(); onClose() }}
            className="flex items-center gap-2 w-full px-3 py-2.5 bg-[#E8320A] text-white rounded-xl text-xs font-medium hover:bg-[#c92b09] transition-colors"
          >
            <Plus size={13} />
            新規チャット
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {threads.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] text-center py-8 px-3">まだ相談がありません</p>
          ) : (
            threads.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl group flex items-start gap-2 transition-colors ${
                  currentThreadId === t.id
                    ? 'bg-[#E8320A]/10 border-l-2 border-[#E8320A] pl-2.5'
                    : 'hover:bg-[#F1F3F8]'
                }`}
              >
                <MessageSquare size={12} className="text-[#9CA3AF] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111827] truncate leading-snug">{t.title}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                    {new Date(t.updated_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, t.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-5 h-5 flex items-center justify-center text-[#9CA3AF] hover:text-red-500 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
