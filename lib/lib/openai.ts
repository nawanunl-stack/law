// lib/openai.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AnalyzedRequirement {
  sectionNumber: string
  title: string
  description: string
  who: string
  what: string
  where: string
  how: string
  documents: string[]
  deadline: string
  responsibleDepts: string[]
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface LawAnalysis {
  summary: string
  category: string
  requirements: AnalyzedRequirement[]
}

export async function analyzeLaw(
  lawTitle: string,
  lawText: string
): Promise<LawAnalysis> {
  const systemPrompt = `คุณเป็นผู้เชี่ยวชาญด้านกฎหมายความปลอดภัยในการทำงาน
วิเคราะห์กฎหมายที่ให้มาและแจกแจงข้อกำหนดออกเป็นข้อย่อย

ตอบเป็น JSON เท่านั้น ตามโครงสร้างนี้:
{
  "summary": "สรุปสาระสำคัญของกฎหมาย 2-3 ประโยค",
  "category": "หมวดหมู่ เช่น ความปลอดภัย, สุขภาพ, สิ่งแวดล้อม, แรงงาน",
  "requirements": [
    {
      "sectionNumber": "มาตรา/ข้อ",
      "title": "หัวข้อสั้นๆ",
      "description": "รายละเอียด",
      "who": "ใครต้องปฏิบัติ (นายจ้าง, จป., ลูกจ้าง ฯลฯ)",
      "what": "ต้องทำอะไร",
      "where": "สถานที่/ขอบเขต",
      "how": "วิธีปฏิบัติ",
      "documents": ["เอกสารที่เกี่ยวข้อง"],
      "deadline": "กำหนดเวลา (ถ้ามี)",
      "responsibleDepts": ["แผนกที่เกี่ยวข้อง เช่น HR, Safety, Production"],
      "priority": "HIGH/MEDIUM/LOW"
    }
  ]
}

ใช้ภาษาไทยที่เข้าใจง่าย ชัดเจน กระชับ`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `ชื่อกฎหมาย: ${lawTitle}\n\nเนื้อหา:\n${lawText.slice(0, 15000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')

  return JSON.parse(content) as LawAnalysis
}

export async function generateNotificationMessage(
  lawTitle: string,
  requirements: AnalyzedRequirement[],
  targetDept: string
): Promise<{ subject: string; message: string }> {
  const relevantReqs = requirements.filter((r) =>
    r.responsibleDepts.some(
      (d) => d.toLowerCase().includes(targetDept.toLowerCase())
    )
  )

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `สร้างข้อความแจ้งเตือนแผนก${targetDept}เกี่ยวกับกฎหมายใหม่
ใช้ภาษาทางการแต่เข้าใจง่าย กระชับ ชัดเจน
ตอบเป็น JSON: {"subject": "หัวข้อ", "message": "เนื้อหา"}`,
      },
      {
        role: 'user',
        content: `กฎหมาย: ${lawTitle}\n\nข้อกำหนดที่เกี่ยวข้อง:\n${JSON.stringify(relevantReqs, null, 2)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')

  return JSON.parse(content)
}

export default openai
