// Sidebar items for the staff panels, shared by every layout (sidebar, top bar
// or drawer). `badge` names a number from useAdminCounts().
export const ADMIN_NAV = {
  department: {
    label: 'Department panel',
    note: 'Only the admin can close an issue, after checking your after-photo.',
    items: [
      { label: 'Assigned issues', to: '/department' },
      { label: 'In progress', to: '/department?status=in-progress', badge: 'inProgress' },
      {
        label: 'Awaiting verification',
        to: '/department?status=awaiting',
        badge: 'awaiting',
      },
      { label: 'Completed', to: '/department?status=completed' },
    ],
  },
  admin: {
    label: 'Admin oversight',
    note: 'Nothing closes without a photo you have checked.',
    items: [
      { label: 'Verification queue', to: '/admin/verify', badge: 'queue' },
      {
        label: 'Reopened issues',
        to: '/admin/verify?view=reopened',
        badge: 'reopened',
        tone: 'amber',
      },
      { label: 'Accountability', to: '/admin/accountability' },
      { label: 'Identity checks', to: '/admin/identity', badge: 'identity' },
    ],
  },
}
