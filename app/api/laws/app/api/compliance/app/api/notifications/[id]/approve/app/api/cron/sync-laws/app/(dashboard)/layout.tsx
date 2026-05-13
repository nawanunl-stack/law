// app/(dashboard)/layout.tsx
import Link from 'next/link'
import { 
  BookOpen, 
  CheckCircle, 
  Bell, 
  LayoutDashboard,
  RefreshCw 
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex items-center h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">
            Law Compliance
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          <NavLink href="/" icon={<LayoutDashboard size={20} />}>
            Dashboard
          </NavLink>
          <NavLink href="/laws" icon={<BookOpen size={20} />}>
            ทะเบียนกฎหมาย
          </NavLink>
          <NavLink href="/compliance" icon={<CheckCircle size={20} />}>
            ประเมินความสอดคล้อง
          </NavLink>
          <NavLink href="/notifications" icon={<Bell size={20} />}>
            รอการอนุมัติ
          </NavLink>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <p className="text-xs text-gray-500">
            สำหรับ จป. (เจ้าหน้าที่ความปลอดภัย)
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h2 className="text-lg font-medium">ระบบจัดการกฎหมายความปลอดภัย</h2>
          <SyncButton />
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}

function SyncButton() {
  return (
    <form action="/api/laws/sync" method="POST">
      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <RefreshCw size={16} />
        ดึงข้อมูลกฎหมายใหม่
      </button>
    </form>
  )
}
