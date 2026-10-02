import AdminLayout from '../../components/layout/AdminLayout'

export default function DepartmentPanel() {
  return (
    <AdminLayout variant="department" active="Assigned issues">
      <div className="p-8">
        <h1 className="font-heading text-4xl font-extrabold text-navy">
          Assigned issues
        </h1>
      </div>
    </AdminLayout>
  )
}