// app/api/compliance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - ดึงสถานะ compliance ทั้งหมด
export async function GET() {
  try {
    const compliances = await prisma.compliance.findMany({
      include: {
        law: {
          select: { id: true, title: true, category: true },
        },
        requirement: {
          select: { id: true, title: true, sectionNumber: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // สรุปสถิติ
    const stats = await prisma.compliance.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    return NextResponse.json({ compliances, stats })
  } catch (error) {
    console.error('Error fetching compliance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    )
  }
}

// POST - บันทึก/อัพเดท compliance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const compliance = await prisma.compliance.upsert({
      where: {
        id: body.id || 'new-record',
      },
      update: {
        status: body.status,
        evidence: body.evidence,
        notes: body.notes,
        assessedBy: body.assessedBy,
        assessedAt: new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
      create: {
        lawId: body.lawId,
        requirementId: body.requirementId,
        status: body.status,
        evidence: body.evidence,
        notes: body.notes,
        assessedBy: body.assessedBy,
        assessedAt: new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    })

    return NextResponse.json(compliance)
  } catch (error) {
    console.error('Error saving compliance:', error)
    return NextResponse.json(
      { error: 'Failed to save compliance' },
      { status: 500 }
    )
  }
}
