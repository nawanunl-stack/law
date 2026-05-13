// app/api/laws/[id]/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeLaw, generateNotificationMessage } from '@/lib/openai'
import { DEPARTMENTS } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const law = await prisma.law.findUnique({
      where: { id: params.id },
    })

    if (!law) {
      return NextResponse.json({ error: 'Law not found' }, { status: 404 })
    }

    if (!law.fullText) {
      return NextResponse.json(
        { error: 'ไม่มีเนื้อหากฎหมายให้วิเคราะห์' },
        { status: 400 }
      )
    }

    // วิเคราะห์ด้วย OpenAI
    const analysis = await analyzeLaw(law.title, law.fullText)

    // บันทึก summary และ category
    await prisma.law.update({
      where: { id: law.id },
      data: {
        summary: analysis.summary,
        category: analysis.category,
        status: 'ACTIVE',
        analyzedAt: new Date(),
      },
    })

    // ลบ requirements เก่า (ถ้ามี)
    await prisma.requirement.deleteMany({
      where: { lawId: law.id },
    })

    // บันทึก requirements ใหม่
    for (const req of analysis.requirements) {
      await prisma.requirement.create({
        data: {
          lawId: law.id,
          sectionNumber: req.sectionNumber,
          title: req.title,
          description: req.description,
          who: req.who,
          what: req.what,
          where: req.where,
          how: req.how,
          documents: req.documents,
          deadline: req.deadline,
          responsibleDepts: req.responsibleDepts,
          priority: req.priority,
        },
      })
    }

    // สร้าง Notification สำหรับแต่ละแผนกที่เกี่ยวข้อง
    const involvedDepts = new Set<string>()
    for (const req of analysis.requirements) {
      for (const dept of req.responsibleDepts) {
        involvedDepts.add(dept)
      }
    }

    for (const deptName of involvedDepts) {
      const dept = DEPARTMENTS.find(
        (d) =>
          d.name.includes(deptName) ||
          deptName.toLowerCase().includes(d.id)
      )

      if (dept) {
        const { subject, message } = await generateNotificationMessage(
          law.title,
          analysis.requirements,
          deptName
        )

        await prisma.notification.create({
          data: {
            lawId: law.id,
            targetDept: dept.name,
            targetEmail: dept.email,
            subject,
            message,
            status: 'PENDING',
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: analysis.summary,
      category: analysis.category,
      requirementsCount: analysis.requirements.length,
      notificationsCreated: involvedDepts.size,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    )
  }
}
