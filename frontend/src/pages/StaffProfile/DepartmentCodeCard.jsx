import VerifyCodeCard from './VerifyCodeCard'
import { verifyDepartmentCode } from '../../services/api'
import { useT } from '../../i18n/useLanguage'

// Department accounts only: the code that proves which department they work for.
export default function DepartmentCodeCard({ profile, onDirtyChange, announce }) {
  const t = useT()
  return (
    <VerifyCodeCard
      id="staff-department"
      inputId="staff-department-code"
      title={t('Department')}
      intro={t('Enter your department\'s code once, so citizens know you really work there.')}
      badgeLabel="Department verified"
      prompt={t('You signed up for {department}.', { department: t(profile.department) })}
      label={t('Department code')}
      hint={t('Ask your department head for the code.')}
      verified={profile.departmentVerified}
      done={{ label: 'You work for', value: t(profile.department) }}
      verify={async (code) => {
        await verifyDepartmentCode(profile.email, code)
        return profile.department
      }}
      successText="Your department is verified."
      onDirtyChange={onDirtyChange}
      announce={announce}
    />
  )
}
