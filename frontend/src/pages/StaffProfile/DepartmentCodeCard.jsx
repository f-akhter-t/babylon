import VerifyCodeCard from './VerifyCodeCard'
import { verifyDepartmentCode } from '../../services/api'

// Department accounts only: the code that proves which department they work for.
export default function DepartmentCodeCard({ profile, onDirtyChange, announce }) {
  return (
    <VerifyCodeCard
      id="staff-department"
      inputId="staff-department-code"
      title="Department"
      intro="Enter your department's code once, so citizens know you really work there."
      badgeLabel="Department verified"
      prompt={`You signed up for ${profile.department}.`}
      label="Department code"
      hint="Ask your department head for the code."
      verified={profile.departmentVerified}
      done={{ label: 'You work for', value: profile.department }}
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
