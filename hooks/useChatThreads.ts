'use client'

import { useState, useCallback } from 'react'
import { ChatThread, ChatMessage } from '@/types'

export function useChatThreads(shopId: string | undefined, toolName: 'chat' | 'advisor' | 'manual' | 'banquet') {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

  const fetchThreads = useCallback(async () => {
    if (!shopId) return
    try {
      const res = await fetch(`/api/chat-threads?shopId=${shopId}&toolName=${toolName}`)
      const json = await res.json()
      if (json.success) setThreads(json.data)
    } catch {
      // ネットワークエラー時はスレッド一覧を空のまま維持
    }
  }, [shopId, toolName])

  const createThread = useCallback(async (title: string): Promise<string | null> => {
    if (!shopId) return null
    try {
      const res = await fetch('/api/chat-threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, toolName, title }),
      })
      const json = await res.json()
      if (json.success) {
        setThreads(prev => [json.data, ...prev])
        setCurrentThreadId(json.data.id)
        return json.data.id
      }
    } catch {
      // スレッド作成失敗
    }
    return null
  }, [shopId, toolName])

  const loadThread = useCallback(async (threadId: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetch(`/api/chat-threads/${threadId}?shopId=${shopId}`)
      const json = await res.json()
      setCurrentThreadId(threadId)
      return json.success ? json.data : []
    } catch {
      setCurrentThreadId(threadId)
      return []
    }
  }, [shopId])

  const saveMessage = useCallback(async (threadId: string, role: string, content: object) => {
    const res = await fetch(`/api/chat-threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content, shopId }),
    })
    if (!res.ok) throw new Error(`メッセージ保存失敗: ${res.status}`)
  }, [shopId])

  const updateTitle = useCallback(async (threadId: string, title: string) => {
    try {
      await fetch(`/api/chat-threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, shopId }),
      })
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title } : t))
    } catch {
      // タイトル更新失敗時はUI変更しない
    }
  }, [shopId])

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      await fetch(`/api/chat-threads/${threadId}?shopId=${shopId}`, { method: 'DELETE' })
      setThreads(prev => prev.filter(t => t.id !== threadId))
      if (currentThreadId === threadId) setCurrentThreadId(null)
    } catch {
      // 削除失敗時はUI変更しない
    }
  }, [currentThreadId, shopId])

  return {
    threads,
    currentThreadId,
    setCurrentThreadId,
    fetchThreads,
    createThread,
    loadThread,
    saveMessage,
    updateTitle,
    deleteThread,
  }
}
