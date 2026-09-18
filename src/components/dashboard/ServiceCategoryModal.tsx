import { Modal } from '../common/Modal'
import { RankingBars } from './RankingBars'
import type { ServiceCategoryRevenue } from '../../lib/dashboardMetrics'
import { currency } from '../../lib/format'
import { colors } from '../../theme/colors'

type ServiceCategoryModalProps = {
  category: ServiceCategoryRevenue | null
  onClose: () => void
}

export const ServiceCategoryModal = ({ category, onClose }: ServiceCategoryModalProps) => {
  return (
    <Modal open={category !== null} onClose={onClose} title={category ? `Ingresos — ${category.label}` : ''}>
      <RankingBars
        items={(category?.services ?? []).map((s) => ({ id: s.serviceTypeId ?? s.label, label: s.label, value: s.revenue }))}
        formatValue={currency}
        color={colors.gold400}
        emptyText="No hay cobros en este período."
      />
    </Modal>
  )
}
