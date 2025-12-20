import { useEffect, useMemo, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import type { CropRegion } from '../utils/imageProcessor.ts'

type ManualCropperProps = {
  file: File
  aspect: number
  onSave: (region: CropRegion) => void
  onClose: () => void
}

const ManualCropper = ({ file, aspect, onSave, onClose }: ManualCropperProps) => {
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
    onSave({
      x,
      y,
      width,
      height,
    })
    onClose()
  }

  const infoText = useMemo(() => {
    if (!imageSize || !croppedAreaPixels) return '拖动/缩放选择区域'
    return `裁剪区域: ${Math.round(croppedAreaPixels.width)}x${Math.round(croppedAreaPixels.height)} / 原图: ${imageSize.width}x${imageSize.height}`
  }, [imageSize, croppedAreaPixels])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <div className="flex w-full max-w-5xl flex-col gap-4 rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">手动裁剪</p>
            <p className="text-xs text-slate-500">{infoText}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!croppedAreaPixels}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              保存裁剪
            </button>
          </div>
        </div>

        <div className="relative h-[420px] overflow-hidden rounded-xl bg-slate-900/70">
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

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">缩放</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

export default ManualCropper

