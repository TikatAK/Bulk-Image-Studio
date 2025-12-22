import { useEffect, useMemo, useState } from 'react'
import { saveAs } from 'file-saver'
import ExportButton from './components/ExportButton.tsx'
import InlineCropper from './components/InlineCropper.tsx'
import ResizeForm from './components/ResizeForm.tsx'
import UploadPanel from './components/UploadPanel.tsx'
import { fileKey, processImages, type CropRegion, type ProcessedImage, type ProcessOptions } from './utils/imageProcessor.ts'

const DEFAULT_OPTIONS: ProcessOptions = {
  targetWidth: 512,
  targetHeight: 512,
  autoWidth: false,
  autoHeight: false,
  ratioX: 1,
  ratioY: 1,
  useHighQuality: true,
  autoFocal: true,
  skipResize: false,
  outputFormat: 'original',
  quality: 80,
  borderColor: '#000000',
  borderThickness: 0,
  watermarkText: '',
  watermarkSize: 24,
  watermarkOpacity: 0.35,
  watermarkPosition: 'bottom-right',
  renamePattern: 'ORIGINAL-NAME_{width}x{height}_xxx',
  startNumber: 1,
}

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [options, setOptions] = useState<ProcessOptions>({ ...DEFAULT_OPTIONS })
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([])
  const [editingCropKey, setEditingCropKey] = useState<string | null>(null)
  const [manualCrops, setManualCrops] = useState<Record<string, CropRegion>>({})
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = (incoming: File[]) => {
    if (!incoming.length) return
    setFiles((prev) => [...prev, ...incoming])
    setProcessedImages([])
    setEditingCropKey(null)
    setMessage(null)
    setError(null)
  }

  const handleClear = () => {
    setFiles([])
    setProcessedImages([])
    setManualCrops({})
    setEditingCropKey(null)
    setMessage(null)
    setError(null)
  }

  const handleOptionsChange = (next: Partial<ProcessOptions>) => {
    setOptions((prev) => ({ ...prev, ...next }))
  }

  const handleProcess = async () => {
    setError(null)
    setMessage(null)

    if (!files.length) {
      setError('请先选择图片')
      return
    }

    if (!options.skipResize && (options.targetWidth <= 0 || options.targetHeight <= 0)) {
      setError('请设置大于 0 的目标宽度与高度')
      return
    }

    setIsProcessing(true)
    try {
      const result = await processImages(files, options, manualCrops)
      setProcessedImages(result)
      setMessage(`已完成 ${result.length} 张图片的批量处理`)
    } catch (err) {
      const fallback = err instanceof Error ? err.message : '处理失败，请稍后再试'
      setError(fallback)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadFiles = async () => {
    if (!processedImages.length) return
    processedImages.forEach((image) => saveAs(image.blob, image.name))
    setMessage(`已触发 ${processedImages.length} 个文件下载`)
  }

  const handleSaveToFolder = async () => {
    if (!processedImages.length) {
      setError('请先完成处理，再保存到文件夹')
      return
    }

    if (!('showDirectoryPicker' in window)) {
      setError('当前浏览器不支持保存到本地文件夹，请改用压缩包下载')
      return
    }

    try {
      // @ts-expect-error File System Access API 仅在支持的浏览器中可用
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      for (const image of processedImages) {
        const fileHandle = await dirHandle.getFileHandle(image.name, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(image.blob)
        await writable.close()
      }
      setMessage('已保存到指定文件夹，如遇系统文件夹限制请在其下创建子文件夹后重试。')
    } catch (err) {
      const fallback = err instanceof Error ? err.message : '保存失败，请检查权限或更换文件夹'
      setError(fallback)
    }
  }

  const handleResetSettings = () => {
    setOptions({ ...DEFAULT_OPTIONS })
    setMessage(null)
    setError(null)
  }

  const selectedSize = useMemo(() => {
    const total = files.reduce((sum, file) => sum + file.size, 0)
    return Math.round(total / 1024)
  }, [files])

  useEffect(() => {
    const next: Record<string, string> = {}
    files.forEach((file) => {
      next[fileKey(file)] = URL.createObjectURL(file)
    })

    setObjectUrls(next)

    return () => {
      Object.values(next).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  const handleOpenManualCrop = (file: File) => {
    setEditingCropKey(fileKey(file))
    setMessage(null)
    setError(null)
  }

  const handleSaveManualCrop = (file: File, region: CropRegion) => {
    const key = fileKey(file)
    setManualCrops((prev) => ({ ...prev, [key]: region }))
    setEditingCropKey(null)
    setMessage('已保存手动裁剪区域')
  }

  const handleRemoveManualCrop = (file: File) => {
    const key = fileKey(file)
    setManualCrops((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setEditingCropKey((prev) => (prev === key ? null : prev))
    setMessage('已移除手动裁剪')
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Bulk Image Studio</p>
            <h1 className="text-2xl font-bold text-slate-900">批量图片裁剪与缩放</h1>
            <p className="text-sm text-slate-600">零上传、隐私友好，支持手动焦点、比例裁剪、重命名、水印与多格式输出。</p>
          </div>
          <div className="text-xs text-slate-500">
            <p>所有处理均在浏览器内完成，不触网。</p>
            <p>若保存到文件夹遇到“包含系统文件”限制，请在其下建子文件夹。</p>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">1. 上传图片</h2>
                <p className="mt-1 text-sm text-slate-600">拖拽或多选文件即可批量导入。</p>
              </div>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600">
                已选 {files.length} 张，合计 {selectedSize} KB
              </span>
            </div>
            <div className="mt-4">
              <UploadPanel selectedCount={files.length} onClear={handleClear} onFilesSelected={handleFilesSelected} />
            </div>
            {files.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {files.map((file, index) => {
                  const key = fileKey(file)
                  const isEditing = editingCropKey === key
                  const hasCrop = Boolean(manualCrops[key])
                  return (
                    <div key={`${file.name}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex flex-col">
                          <span className="truncate text-sm font-medium text-slate-900">{file.name}</span>
                          <span className="text-xs text-slate-500">{Math.round(file.size / 1024)} KB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasCrop && (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">已手动裁剪</span>
                          )}
                          <button
                            type="button"
                            onClick={() => (isEditing ? setEditingCropKey(null) : handleOpenManualCrop(file))}
                            className="inline-flex items-center justify-center rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                          >
                            {isEditing ? '收起' : '调整焦点'}
                          </button>
                          {hasCrop && (
                            <button
                              type="button"
                              onClick={() => handleRemoveManualCrop(file)}
                              className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              移除
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="border-t border-slate-100">
                        {isEditing ? (
                          <InlineCropper
                            file={file}
                            aspect={options.ratioY === 0 ? 1 : options.ratioX / Math.max(1, options.ratioY)}
                            onSave={(region) => handleSaveManualCrop(file, region)}
                            onCancel={() => setEditingCropKey(null)}
                          />
                        ) : (
                          <img src={objectUrls[key]} alt={file.name} className="h-52 w-full bg-slate-50 object-contain" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">2. 调整尺寸与裁剪</h2>
                <p className="mt-1 text-sm text-slate-600">
                  支持固定像素、按比例自动计算，以及智能焦点裁剪（smartcrop）。
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetSettings}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                重置设置
              </button>
            </div>

            <ResizeForm options={options} disabled={isProcessing} isProcessing={isProcessing} onChange={handleOptionsChange} onSubmit={handleProcess} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <h3 className="text-sm font-semibold text-slate-800">格式与质量</h3>
                <div className="grid gap-3 text-sm text-slate-700">
                  <label className="flex items-center justify-between gap-3">
                    <span>输出格式</span>
                    <select
                      className="w-40 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      value={options.outputFormat}
                      onChange={(e) => handleOptionsChange({ outputFormat: e.target.value as ProcessOptions['outputFormat'] })}
                      disabled={isProcessing}
                    >
                      <option value="original">保持原格式</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WEBP</option>
                      <option value="avif">AVIF</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span>质量（1-100）</span>
                      <span className="text-xs text-slate-500">{options.quality}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={options.quality}
                      disabled={isProcessing}
                      onChange={(e) => handleOptionsChange({ quality: Number.parseInt(e.target.value, 10) })}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <h3 className="text-sm font-semibold text-slate-800">水印与边框</h3>
                <div className="grid gap-3 text-sm text-slate-700">
                  <label className="flex items-center justify-between gap-3">
                    <span>边框颜色</span>
                    <input
                      type="color"
                      value={options.borderColor}
                      disabled={isProcessing}
                      onChange={(e) => handleOptionsChange({ borderColor: e.target.value })}
                      className="h-9 w-16 cursor-pointer rounded border border-slate-200 bg-white"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3">
                    <span>边框厚度（px）</span>
                    <input
                      type="number"
                      min={0}
                      value={options.borderThickness}
                      disabled={isProcessing}
                      onChange={(e) => handleOptionsChange({ borderThickness: Number.parseInt(e.target.value, 10) || 0 })}
                      className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span>水印文字</span>
                      <span className="text-xs text-slate-500">留空则不添加</span>
                    </div>
                    <input
                      type="text"
                      value={options.watermarkText}
                      disabled={isProcessing}
                      onChange={(e) => handleOptionsChange({ watermarkText: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="例如 © 2025 my studio"
                    />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex flex-col gap-1 text-sm">
                      <span>字号</span>
                      <input
                        type="number"
                        min={8}
                        value={options.watermarkSize}
                        disabled={isProcessing}
                        onChange={(e) => handleOptionsChange({ watermarkSize: Number.parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span>不透明度</span>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={options.watermarkOpacity}
                        disabled={isProcessing}
                        onChange={(e) => handleOptionsChange({ watermarkOpacity: Number.parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span>位置</span>
                      <select
                        value={options.watermarkPosition}
                        disabled={isProcessing}
                        onChange={(e) =>
                          handleOptionsChange({ watermarkPosition: e.target.value as ProcessOptions['watermarkPosition'] })
                        }
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="bottom-right">右下</option>
                        <option value="bottom-left">左下</option>
                        <option value="top-right">右上</option>
                        <option value="top-left">左上</option>
                        <option value="center">居中</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <h3 className="text-sm font-semibold text-slate-800">重命名与编号</h3>
              <div className="grid gap-3 md:grid-cols-[1.5fr,0.5fr]">
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>命名模式</span>
                    <span className="text-xs text-slate-500">支持 ORIGINAL-NAME / xxx / &#123;width&#125; / &#123;height&#125;</span>
                  </div>
                  <input
                    type="text"
                    value={options.renamePattern}
                    disabled={isProcessing}
                    onChange={(e) => handleOptionsChange({ renamePattern: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="例如 image-xxx 或 ORIGINAL-NAME_{width}x{height}"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  <span>起始编号</span>
                  <input
                    type="number"
                    min={0}
                    value={options.startNumber}
                    disabled={isProcessing}
                    onChange={(e) => handleOptionsChange({ startNumber: Number.parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
              </div>
            </div>

            {error && <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
            {message && <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">3. 下载 / 导出</h2>
                <p className="mt-1 text-sm text-slate-600">
                  支持直接下载、打包 ZIP 或保存到文件夹（需浏览器支持 File System Access）。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={isProcessing || !files.length}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? '处理中...' : '处理全部图片'}
                </button>
                <ExportButton images={processedImages} disabled={!processedImages.length} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadFiles}
                disabled={!processedImages.length}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                逐个下载文件
              </button>
              <button
                type="button"
                onClick={handleSaveToFolder}
                disabled={!processedImages.length}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                保存到文件夹
              </button>
              <button
                type="button"
                onClick={() => setProcessedImages([])}
                disabled={!processedImages.length}
                className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                清空结果
              </button>
            </div>

            {processedImages.length > 0 ? (
              <ul className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                {processedImages.map((image, index) => (
                  <li key={`${image.name}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex flex-1 flex-col">
                      <span className="truncate font-medium">{image.name}</span>
                      <span className="text-xs text-slate-500">
                        {image.width}x{image.height} · {image.mimeType}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveAs(image.blob, image.name)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      下载
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">暂无处理结果。请先上传并处理图片。</p>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

export default App
