import { useState } from 'react'

// Basic emoji set for reactions
const BASIC_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥']

interface ReactionPickerProps {
  onSelect: (emote: string) => void
  onClose: () => void
}

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleSelect = (emote: string) => {
    onSelect(emote)
    setIsOpen(false)
    onClose()
  }

  const handleClickOutside = () => {
    setIsOpen(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleClickOutside}
      />

      {/* Picker */}
      <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-lg p-2 flex gap-1 z-50 border border-gray-700">
        {BASIC_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSelect(emoji)}
            className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-gray-700"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
