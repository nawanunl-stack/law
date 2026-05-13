// app/api/notifications/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST - Approve และส่ง notification
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const action = body.action as 'approve' | 'reject'

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    if (action === 'reject') {
      await prisma.notification.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          approvedBy: body.approvedBy || 'System',
          approvedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, action: 'rejected' })
    }

    // Approve - อัพเดทสถานะ
    await prisma.notification.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedBy: body.approvedBy || 'System',
        approvedAt: new Date(),
      },
    })

    // ส่งอีเมล (ถ้าต้องการ - ใช้ Resend, SendGrid, etc.)
    if (notification.targetEmail) {
      // TODO: Implement email sending
      // await sendEmail({
      //   to: notification.targetEmail,
      //   subject: notification.subject,
      //   body: notification.message,
      // })

      await prisma.notification.update({
        where: { id: params.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true, action: 'approved' })
  } catch (error) {
    console.error('Error approving notification:', error)
    return NextResponse.json(
      { error: 'Failed to approve notification' },
      { status: 500 }
    )
  }
}
