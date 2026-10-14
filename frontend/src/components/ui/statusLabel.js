// Plain-text status labels. Kept apart from ReportStatusPill.jsx so that file only exports a component.
const LABEL = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  reopened: 'Reopened',
}

export const statusLabel = (s) => LABEL[s]
