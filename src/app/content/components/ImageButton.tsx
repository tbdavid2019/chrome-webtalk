import { Button } from '@/components/ui/Button'
import { createElement } from '@/utils'
import { ImageIcon } from 'lucide-react'

export interface ImageButtonProps {
  onSelect?: (file: File) => void
  onSelectMultiple?: (files: File[]) => void
  disabled?: boolean
  multiple?: boolean
}

const ImageButton = ({ onSelect, onSelectMultiple, disabled, multiple = false }: ImageButtonProps) => {
  const handleClick = () => {
    const input = createElement<HTMLInputElement>(
      `<input type="file" accept="image/png,image/jpeg,image/webp" ${multiple ? 'multiple' : ''} />`
    )

    input.addEventListener(
      'change',
      async (e: Event) => {
        const files = Array.from((e.target as HTMLInputElement).files ?? [])
        if (multiple) {
          onSelectMultiple?.(files)
        } else if (files[0]) {
          onSelect?.(files[0])
        }
      },
      { once: true }
    )

    input.click()
  }

  return (
    <Button disabled={disabled} onClick={handleClick} variant="ghost" size="icon" className="dark:text-white">
      <ImageIcon size={20} />
    </Button>
  )
}

ImageButton.displayName = 'ImageButton'

export default ImageButton
