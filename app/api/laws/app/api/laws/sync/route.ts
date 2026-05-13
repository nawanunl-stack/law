// app/api/laws/sync/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  scrapeRoyalGazette,
  scrapeLabourWelfare,
  extractPdfText,
} from '@/lib/scraper'

export async function POST() {
  const syncLog = await prisma.syncLog.create({
    data: {
      source: 'ROYAL_GAZETTE',
      status: 'RUNNING',
    },
  })

  try {
    // ดึงจากราชกิจจานุเบกษา
    const royalGazetteLaws = await scrapeRoyalGazette()

    // ดึงจากกรมสวัสดิการแรงงาน
    const labourLaws = await scrapeLabourWelfare()

    let lawsAdded = 0

    // บันทึกกฎหมายจากราชกิจจานุเบกษา
    for (const law of royalGazetteLaws) {
      const existing = await prisma.law.findFirst({
        where: { title: law.title, source: 'ROYAL_GAZETTE' },
      })

      if (!existing) {
        // ดึงเนื้อหา PDF ถ้ามี
        let fullText = ''
        if (law.pdfUrl) {
          fullText = await extractPdfText(law.pdfUrl)
        }

        await prisma.law.create({
          data: {
            title: law.title,
            lawNumber: law.lawNumber,
            publishedDate: law.publishedDate,
            source: 'ROYAL_GAZETTE',
            sourceUrl: law.sourceUrl,
            pdfUrl: law.pdfUrl,
            fullText: fullText || null,
            status: 'PENDING',
          },
        })
        lawsAdded++
      }
    }

    // บันทึกกฎหมายจากกรมสวัสดิการ
    for (const law of labourLaws) {
      const existing = await prisma.law.findFirst({
        where: { title: law.title, source: 'LABOUR_WELFARE' },
      })

      if (!existing) {
        let fullText = ''
        if (law.pdfUrl) {
          fullText = await extractPdfText(law.pdfUrl)
        }

        await prisma.law.create({
          data: {
            title: law.title,
            source: 'LABOUR_WELFARE',
            sourceUrl: law.sourceUrl,
            pdfUrl: law.pdfUrl,
            fullText: fullText || null,
            status: 'PENDING',
          },
        })
        lawsAdded++
      }
    }

    // อัพเดท sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'SUCCESS',
        lawsFound: royalGazetteLaws.length + labourLaws.length,
        lawsAdded,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      lawsFound: royalGazetteLaws.length + labourLaws.length,
      lawsAdded,
    })
  } catch (error) {
    console.error('Sync error:', error)

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    })

    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    )
  }
}
