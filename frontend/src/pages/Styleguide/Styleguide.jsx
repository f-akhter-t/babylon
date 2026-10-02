import { useState } from 'react'
import clsx from 'clsx'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Button from '../../components/ui/Button'
import StatusPill from '../../components/ui/StatusPill'
import CategoryChip from '../../components/ui/CategoryChip'
import PriorityBadge from '../../components/ui/PriorityBadge'
import StyleSection from './StyleSection'

const swatches = [
  'bg-navy', 'bg-forest', 'bg-slate', 'bg-mint', 'bg-mint-deep', 'bg-brand',
  'bg-amber', 'bg-amber-dark', 'bg-muted', 'bg-page',
  'bg-map-land', 'bg-map-park', 'bg-map-water',
]
const categories = ['All', 'Roads', 'Waste', 'Water', 'Lighting', 'Bridges']
const statuses = ['open', 'in-progress', 'resolved']
const priorities = ['urgent', 'high', 'medium', 'reopened', 'fix-verified']

export default function Styleguide() {
  const [category, setCategory] = useState('All')

  return (
    <div>
      <StyleSection title="Navbar: logged out">
        <Navbar variant="logged-out" />
      </StyleSection>
      <StyleSection title="Navbar: citizen">
        <Navbar variant="citizen" unread={3} />
      </StyleSection>
      <StyleSection title="Navbar: admin">
        <Navbar variant="admin" />
      </StyleSection>

      <div className="px-10">
        <StyleSection title="Colors">
          <div className="flex flex-wrap gap-4">
            {swatches.map((swatch) => (
              <div key={swatch} className="text-sm text-navy">
                <div className={clsx('h-14 w-24 rounded-chip border border-navy/20', swatch)} />
                {swatch}
              </div>
            ))}
          </div>
        </StyleSection>

        <StyleSection title="Text on mint (check contrast)">
          <div className="rounded-card bg-mint p-6">
            <p className="font-heading text-xl font-extrabold text-navy">Navy heading on mint</p>
            <p className="text-forest">Forest text on mint</p>
            <p className="text-muted">Muted text on mint</p>
          </div>
        </StyleSection>

        <StyleSection title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="brand">Brand</Button>
            <Button variant="dark">Dark</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <span className="rounded-card bg-navy p-3">
              <Button variant="outline-light">Outline on navy</Button>
            </span>
          </div>
        </StyleSection>

        <StyleSection title="Status pills">
          <div className="flex gap-3">
            {statuses.map((status) => (
              <StatusPill key={status} status={status} />
            ))}
          </div>
        </StyleSection>

        <StyleSection title="Category chips (click to select)">
          <div className="flex flex-wrap gap-3">
            {categories.map((name) => (
              <CategoryChip
                key={name}
                label={name}
                active={category === name}
                onClick={() => setCategory(name)}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-3">
            <CategoryChip label="Forest active" active tone="forest" onClick={() => {}} />
            <CategoryChip label="Label only" />
          </div>
        </StyleSection>

        <StyleSection title="Priority badges">
          <div className="flex gap-3 rounded-card bg-slate p-4">
            {priorities.map((priority) => (
              <PriorityBadge key={priority} priority={priority} />
            ))}
          </div>
        </StyleSection>
      </div>

      <Footer />
    </div>
  )
}