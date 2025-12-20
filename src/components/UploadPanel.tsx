import { useRef } from 'react'

type UploadPanelProps = {
  selectedCount: number
  onFilesSelected: (files: File[]) => void
  onClear: () => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

const UploadPanel = ({ selectedCount, onFilesSelected, onClear }: UploadPanelProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleSelect = () => {
    inputRef.current?.click()
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const fileList = event.target.files
    if (!fileList?.length) return

    const files = Array.from(fileList).filter((file) => ACCEPTED_TYPES.includes(file.type))
    onFilesSelected(files)
    event.target.value = ''
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    const fileList = event.dataTransfer.files
    if (!fileList?.length) return

    const files = Array.from(fileList).filter((file) => ACCEPTED_TYPES.includes(file.type))
    onFilesSelected(files)
  }

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <div
          className="flex-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-4"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p className="text-sm font-medium text-slate-800">拖拽图片到此处，或点击右侧按钮选择文件</p>
          <p className="mt-1 text-xs text-slate-500">支持 JPG / PNG / WebP / AVIF，可一次选择多张。</p>
          <p className="mt-2 text-xs text-indigo-600">已选择 {selectedCount} 张图片</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSelect}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          选择文件
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!selectedCount}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          清空
        </button>
      </div>
    </div>
  )
}

export default UploadPanel

