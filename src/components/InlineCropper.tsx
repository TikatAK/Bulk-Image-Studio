import { useEffect, useMemo, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import type { CropRegion } from '../utils/imageProcessor.ts'

type InlineCropperProps = {
  file: File
  aspect: number
  onSave: (region: CropRegion) => void
  onCancel: () => void
}

const InlineCropper = ({ file, aspect, onSave, onCancel }: InlineCropperProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  const handleImageLoaded = (info: { naturalWidth: number; naturalHeight: number }) => {
    setImageSize({ width: info.naturalWidth, height: info.naturalHeight })
  }

  const handleCropComplete = (_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }

  const handleSave = () => {
    if (!croppedAreaPixels) return
    const { x, y, width, height } = croppedAreaPixels
    onSave({ x, y, width, height })
  }

  const infoText = useMemo(() => {
    if (!imageSize || !croppedAreaPixels) return '拖动与缩放以调整裁剪区域'
    return `裁剪区域: ${Math.round(croppedAreaPixels.width)}x${Math.round(croppedAreaPixels.height)} / 原图: ${imageSize.width}x${imageSize.height}`
  }, [imageSize, croppedAreaPixels])

  return (
    <div className="flex flex-col gap-3 bg-slate-50">
      <div className="relative h-64 overflow-hidden bg-slate-900/70">
        {imageUrl && (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            onMediaLoaded={handleImageLoaded}
            cropShape="rect"
            showGrid
            objectFit="contain"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3 text-sm text-slate-700">
        <span className="text-xs text-slate-500">{infoText}</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            缩放
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
            />
          </label>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!croppedAreaPixels}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default InlineCropper


