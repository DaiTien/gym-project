import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { exercisesApi } from '../api/programs'

interface Props {
  exerciseId: string
  imageUrl: string | null
  name: string
  size?: 'sm' | 'md'
  editable?: boolean
}

export default function ExerciseImage({ exerciseId, imageUrl, name, size = 'md', editable = false }: Props) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const updateImage = useMutation({
    mutationFn: (url: string) => exercisesApi.updateImage(exerciseId, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] })
      qc.invalidateQueries({ queryKey: ['active-program'] })
      qc.invalidateQueries({ queryKey: ['session'] })
    },
  })

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return

    // Resize về thumbnail 200x200 trước khi upload
    const resized = await resizeImage(file, 200)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `thumb.${ext}`

    setUploading(true)
    setPreview(URL.createObjectURL(resized))
    try {
      const { uploadUrl, publicUrl } = await exercisesApi.getUploadUrl(
        exerciseId, fileName, resized.type
      )
      await fetch(uploadUrl, {
        method: 'PUT',
        body: resized,
        headers: { 'Content-Type': resized.type },
      })
      // Thêm cache buster để Supabase trả ảnh mới
      await updateImage.mutateAsync(`${publicUrl}?t=${Date.now()}`)
    } finally {
      setUploading(false)
    }
  }

  const sizeClass = size === 'sm'
    ? 'w-12 h-12 rounded-xl'
    : 'w-16 h-16 rounded-2xl'

  const displayUrl = preview ?? imageUrl

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClass} bg-slate-700 overflow-hidden flex items-center justify-center`}
        onClick={() => editable && inputRef.current?.click()}
        style={{ cursor: editable ? 'pointer' : 'default' }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl select-none">💪</span>
        )}

        {/* Overlay khi uploading */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-inherit">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Edit hint */}
        {editable && !uploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center group">
            <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-bold">Đổi</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}

// Resize ảnh về maxSize × maxSize, giữ aspect ratio, output JPEG
async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxSize / img.width, maxSize / img.height)
      canvas.width  = Math.round(img.width  * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}
