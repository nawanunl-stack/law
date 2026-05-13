// app/api/cron/sync-laws/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Vercel Cron - ทำงานทุกวัน 6:00 น.
export async function GET(request: NextRequest) {
  // ตรวจสอบ Authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // เรียก sync API
    const baseUrl = process.env.VERCEL_URL
      ? `[${process.env.vercel_url}](https://${process.env.VERCEL_URL})`
      : '[localhost](http://localhost:3000)'

    const response = await fetch(`${baseUrl}/api/laws/sync`, {
      method: 'POST',
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: 'Cron sync failed' },
      { status: 500 }
    )
  }
}
