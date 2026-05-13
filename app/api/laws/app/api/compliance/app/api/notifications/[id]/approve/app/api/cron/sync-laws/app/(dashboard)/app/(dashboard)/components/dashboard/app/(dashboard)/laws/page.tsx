// app/(dashboard)/laws/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { FileText, ExternalLink, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LawsPage() {
  const laws = await prisma.law.findMany({
    include: {
      _count: {
        select: { requirements: true, compliances: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ทะเบียนกฎหมาย</h1>
        <div className="flex gap-2">
          <select className="px-4 py-2 border rounded-lg text-sm">
            <option value="">ทุกแหล่ง</option>
            <option value="ROYAL_GAZETTE">ราชกิจจานุเบกษา</option>
            <option value="LABOUR_WELFARE">กรมสวัสดิการแรงงาน</option>
          </select>
          <select className="px-4 py-2 border rounded-lg text-sm">
            <option value="">ทุกสถานะ</option>
            <option value="ACTIVE">วิเคราะห์แล้ว</option>
            <option value="PENDING">รอวิเคราะห์</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                กฎหมาย
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                แหล่งที่มา
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                วันที่ประกาศ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ข้อกำหนด
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                สถานะ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {laws.map((law) => (
              <tr key={law.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <FileText
                      className="w-5 h-5 text-gray-400 mt-0.5"
                    />
                    <div>
                      <Link
                        href={`/laws/${law.id}`}
                        className="font-medium text-blue-600 hover:underline line-clamp-2"
                      >
                        {law.title}
                      </Link>
                      {law.lawNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          {law.lawNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">
                    {law.source === 'ROYAL_GAZETTE'
                      ? 'ราชกิจจาฯ'
                      : 'กรมสวัสดิการฯ'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(law.publishedDate)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">
                    {law._count.requirements} ข้อ
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={law.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {law.status === 'PENDING' && (
                      <AnalyzeButton lawId={law.id} />
                    )}
                    {law.sourceUrl && (
                      <a
                        href={law.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {laws.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            ยังไม่มีกฎหมายในระบบ
            <br />
            กด "ดึงข้อมูลกฎหมายใหม่" เพื่อเริ่มต้น
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    AMENDED: 'bg-blue-100 text-blue-700',
    REPEALED: 'bg-gray-100 text-gray-700',
  }

  const labels = {
    ACTIVE: 'วิเคราะห์แล้ว',
    PENDING: 'รอวิเคราะห์',
    AMENDED: 'แก้ไขเพิ่มเติม',
    REPEALED: 'ยกเลิก',
  }

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        styles[status as keyof typeof styles] || styles.PENDING
      }`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}

function AnalyzeButton({ lawId }: { lawId: string }) {
  return (
    <form action={`/api/laws/${lawId}/analyze`} method="POST">
      <button
        type="submit"
        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        <Sparkles size={14} />
        วิเคราะห์ด้วย AI
      </button>
    </form>
  )
}
