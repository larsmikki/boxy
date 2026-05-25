import { Button, Modal } from '@/components/ui'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmModal({
  isOpen, title, description, onConfirm, onCancel, confirmLabel = 'Confirm', danger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <Modal title={title} onClose={onCancel} maxWidth={400}>
      <div className="p-6">
        <p className="text-sm mb-5 text-text2">
          {description}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
