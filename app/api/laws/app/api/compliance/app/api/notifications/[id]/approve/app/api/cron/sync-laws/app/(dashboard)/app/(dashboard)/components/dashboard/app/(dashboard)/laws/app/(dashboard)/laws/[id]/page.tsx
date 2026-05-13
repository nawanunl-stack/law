// app/(dashboard)/laws/[id]/page.tsx
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, MapPin, FileText, Clock } from 'lucide-react'

export default async function LawDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const law = await prisma.law.findUnique({
    where: { id: params.id },
    include: {
      requirements: {
        orderBy: { sectionNumber: 'asc' },
      },
      compliances: true,
    },
  })

  if (!law) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/laws"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{law.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            {law.lawNumber && <span>{law.lawNumber}</span>}
            <span>•</span>
            <span>{formatDate(law.publishedDate)}</span>
            {law.category && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  {law.category}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {law.summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="font-medium text-blue-900 mb-2">
            สรุปสาระสำคัญ
          </h2>
          <p className="text-blue-800">{law.summary}</p>
        </div>
      )}

      {/* Requirements */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">
            ข้อกำหนดที่ต้องปฏิบัติ ({law.requirements.length} ข้อ)
          </h2>
        </div>

        <div className="divide-y">
          {law.requirements.map((req, index) => (
            <div key={req.id} className="p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">
                      {req.sectionNumber && `${req.sectionNumber}: `}
                      {req.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {req.description}
                    </p>
                  </div>

                  {/* 5W1H Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    {req.who && (
                      <DetailItem
                        icon={<User size={16} />}
                        label="ใครต้องทำ"
                        value={req.who}
                      />
                    )}
                    {req.what && (
                      <DetailItem
                        icon={<FileText size={16} />}
                        label="ทำอะไร"
                        value={req.what}
                      />
                    )}
                    {req.where && (
                      <DetailItem
                        icon={<MapPin size={16} />}
                        label="ที่ไหน"
                        value={req.where}
                      />
                    )}
                    {req.how && (
                      <DetailItem
                        icon={<FileText size={16} />}
                        label="อย่างไร"
                        value={req.how}
                      />
                    )}
                    {req.deadline && (
                      <DetailItem
                        icon={<Clock size={16} />}
                        label="กำหนดเวลา"
                        value={req.deadline}
                      />
                    )}
                  </div>

                  {/* Documents */}
                  {req.documents.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        เอกสารที่เกี่ยวข้อง:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {req.documents.map((doc, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responsible Departments */}
                  {req.responsibleDepts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        แผนกที่เกี่ยวข้อง:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {req.responsibleDepts.map((dept, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      ความสำคัญ:
                    </span>
                    <PriorityBadge priority={req.priority} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {law.requirements.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              ยังไม่มีข้อกำหนด - กด "วิเคราะห์ด้วย AI" เพื่อแจกแจงข้อกำหนด
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
  }

  const labels = {
    HIGH: 'สูง',
    MEDIUM: 'ปานกลาง',
    LOW: 'ต่ำ',
  }

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded ${
        styles[priority as keyof typeof styles] || styles.MEDIUM
      }`}
    >
      {labels[priority as keyof typeof labels] || priority}
    </span>
  )
}
