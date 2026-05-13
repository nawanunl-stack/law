// app/api/laws/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - ดึงรายการกฎหมายทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = {}
    if (source) where.source = source
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { lawNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const laws = await prisma.law.findMany({
      where,
      include: {
        requirements: true,
        compliances: true,
        _count: {
          select: {
            requirements: true,
            compliances: true,
            notifications: true,
          },
        },
      },
      orderBy: { publishedDate: 'desc' },
    })

    return NextResponse.json(laws)
  } catch (error) {
    console.error('Error fetching laws:', error)
    return NextResponse.json(
      { error: 'Failed to fetch laws' },
      { status: 500 }
    )
  }
}

// POST - เพิ่มกฎหมายใหม่ (manual)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const law = await prisma.law.create({
      data: {
        title: body.title,
        lawNumber: body.lawNumber,
        publishedDate: body.publishedDate
          ? new Date(body.publishedDate)
          : null,
        effectiveDate: body.effectiveDate
          ? new Date(body.effectiveDate)
          : null,
        source: body.source || 'OTHER',
        sourceUrl: body.sourceUrl,
        pdfUrl: body.pdfUrl,
        fullText: body.fullText,
        category: body.category,
        status: 'PENDING',
      },
    })

    return NextResponse.json(law, { status: 201 })
  } catch (error) {
    console.error('Error creating law:', error)
    return NextResponse.json(
      { error: 'Failed to create law' },
      { status: 500 }
    )
  }
}
