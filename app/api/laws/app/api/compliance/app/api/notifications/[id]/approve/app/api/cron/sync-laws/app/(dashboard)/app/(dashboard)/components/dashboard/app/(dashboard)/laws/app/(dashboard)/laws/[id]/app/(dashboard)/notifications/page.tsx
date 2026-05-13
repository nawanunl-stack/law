// app/(dashboard)/notifications/page.tsx
import { prisma } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import { Check, X, Mail, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const notifications = await prisma.notification.findMany({
    where: { status: 'PENDING' },
    include: {
      law: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          รอการอนุมัติ ({notifications.length})
        </h1>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Building2 size={14} />
                  <span>{notif.targetDept}</span>
                  {notif.targetEmail && (
                    <>
                      <span>•</span>
                      <Mail size={14} />
                      <span>{notif.targetEmail}</span>
                    </>
                  )}
                </div>

                <h3 className="font-medium text-lg">{notif.subject}</h3>

                <p className="text-sm text-gray-500 mt-1">
                  เกี่ยวกับ: {notif.law.title}
                </p>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {notif.message}
                  </p>
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  สร้างเมื่อ {formatDateTime(notif.createdAt)}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                <ApproveButton notifId={notif.id} action="approve" />
                <ApproveButton notifId={notif.id} action="reject" />
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            ไม่มีรายการรออนุมัติ
          </div>
        )}
      </div>
    </div>
  )
}

function ApproveButton({
  notifId,
  action,
}: {
  notifId: string
  action: 'approve' | 'reject'
}) {
  const isApprove = action === 'approve'

  return (
    <form
      action={`/api/notifications/${notifId}/approve`}
      method="POST"
    >
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isApprove
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {isApprove ? (
          <>
            <Check size={16} />
            อนุมัติ
          </>
        ) : (
          <>
            <X size={16} />
            ปฏิเสธ
          </>
        )}
      </button>
    </form>
  )
}
