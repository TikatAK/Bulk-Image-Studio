import { useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { ProcessedImage } from '../utils/imageProcessor.ts'

type ExportButtonProps = {
  images: ProcessedImage[]
  disabled?: boolean
  fileName?: string
}

const ExportButton = ({ images, disabled, fileName = 'bulk-images.zip' }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!images.length || disabled || isExporting) return
    setIsExporting(true)
    try {
      const zip = new JSZip()
      images.forEach((image) => {
        zip.file(image.name, image.blob)
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, fileName)
    } catch (err) {
      const message = err instanceof Error ? err.message : '打包失败，请稍后再试'
      window.alert(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!images.length || disabled || isExporting}
      className="inline-flex items-center justify-center rounded-lg border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isExporting ? '正在打包...' : '下载 ZIP'}
    </button>
  )
}

export default ExportButton

