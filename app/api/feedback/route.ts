import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const TYPE_LABELS: Record<string, string> = {
  bug: '🐛 バグ報告',
  feature: '✨ 機能リクエスト',
  other: '💬 その他',
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*, shops(name)')
      .eq('id', authUser.id)
      .single()

    const { type, title, description, imageUrl } = await req.json()
    if (!type || !title || !description) {
      return NextResponse.json({ success: false, error: 'missing fields' }, { status: 400 })
    }

    const shopName = (userData?.shops as { name: string } | null)?.name ?? null
    const shopId = userData?.shop_id ?? null

    // DBに保存
    await supabaseAdmin.from('feedback').insert({
      shop_id: shopId,
      shop_name: shopName,
      user_email: authUser.email,
      type,
      title,
      description,
      image_url: imageUrl ?? null,
      status: 'new',
    })

    // メール送信（RESEND_API_KEYが設定されている場合のみ）
    if (process.env.RESEND_API_KEY && process.env.DEVELOPER_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Manaita <onboarding@resend.dev>',
          to: process.env.DEVELOPER_EMAIL,
          subject: `[Manaita] ${TYPE_LABELS[type] ?? type}：${title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #111827; border-bottom: 2px solid #E8320A; padding-bottom: 8px;">
                ${TYPE_LABELS[type] ?? type}
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr>
                  <td style="padding: 8px; background: #F1F3F8; font-weight: bold; width: 120px; border-radius: 4px;">店舗</td>
                  <td style="padding: 8px;">${shopName ?? '不明'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; background: #F1F3F8; font-weight: bold; border-radius: 4px;">送信者</td>
                  <td style="padding: 8px;">${authUser.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; background: #F1F3F8; font-weight: bold; border-radius: 4px;">タイトル</td>
                  <td style="padding: 8px; font-weight: bold;">${title}</td>
                </tr>
              </table>
              <div style="background: #F9FAFB; border-left: 4px solid #E8320A; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
                <p style="white-space: pre-wrap; margin: 0; color: #374151;">${description}</p>
              </div>
              ${imageUrl ? `<div style="margin: 16px 0;"><p style="font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 8px;">📸 スクリーンショット</p><img src="${imageUrl}" alt="screenshot" style="max-width: 100%; border-radius: 8px; border: 1px solid #E5E7EB;" /></div>` : ''}
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
                送信日時：${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Email send failed:', emailError)
        // メール失敗してもDBには保存済みなのでOK
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('feedback error:', error)
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 })
  }
}
