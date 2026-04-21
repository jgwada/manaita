'use client'

import { useState, useCallback } from 'react'
import { ChatThread, ChatMessage } from '@/types'

export function useChatThreads(shopId: string | undefined, toolName: 'chat' | 'advisor') {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

  const fetchThreads = useCallback(async () => {
    if (!shopId) return
    const res = await fetch(`/api/chat-threads?shopId=${shopId}&toolName=${toolName}`)
    const json = await res.json()
    if (json.success) setThreads(json.data)
  }, [shopId, toolName])

  const createThread = useCallback(async (title: string): Promise<string | null> => {
    if (!shopId) return null
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
    return null
  }, [shopId, toolName])

  const loadThread = useCallback(async (threadId: string): Promise<ChatMessage[]> => {
    const res = await fetch(`/api/chat-threads/${threadId}`)
    const json = await res.json()
    setCurrentThreadId(threadId)
    return json.success ? json.data : []
  }, [])

  const saveMessage = useCallback(async (threadId: string, role: string, content: object) => {
    await fetch(`/api/chat-threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content }),
    })
  }, [])

  const updateTitle = useCallback(async (threadId: string, title: string) => {
    await fetch(`/api/chat-threads/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title } : t))
  }, [])

  const deleteThread = useCallback(async (threadId: string) => {
    await fetch(`/api/chat-threads/${threadId}`, { method: 'DELETE' })
    setThreads(prev => prev.filter(t => t.id !== threadId))
    if (currentThreadId === threadId) setCurrentThreadId(null)
  }, [currentThreadId])

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
