import type { ProcessOptions } from '../utils/imageProcessor.ts'

type ResizeFormProps = {
  options: ProcessOptions
  disabled?: boolean
  isProcessing?: boolean
  onChange: (next: Partial<ProcessOptions>) => void
  onSubmit: () => void
}

const ResizeForm = ({ options, disabled, isProcessing, onChange, onSubmit }: ResizeFormProps) => {
  const handleNumber = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:items-end lg:grid-cols-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="width">
          目标宽度（px）
        </label>
        <div className="flex gap-2">
          <input
            id="width"
            type="number"
            min={1}
            inputMode="numeric"
            value={options.targetWidth}
            onChange={(e) => onChange({ targetWidth: handleNumber(e.target.value) })}
            disabled={disabled || options.autoWidth || options.skipResize}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="例如 800"
          />
          <label className="inline-flex select-none items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={options.autoWidth}
              disabled={disabled || options.skipResize}
              onChange={(e) => onChange({ autoWidth: e.target.checked, autoHeight: e.target.checked ? false : options.autoHeight })}
            />
            自动宽度
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="height">
          目标高度（px）
        </label>
        <div className="flex gap-2">
          <input
            id="height"
            type="number"
            min={1}
            inputMode="numeric"
            value={options.targetHeight}
            onChange={(e) => onChange({ targetHeight: handleNumber(e.target.value) })}
            disabled={disabled || options.autoHeight || options.skipResize}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="例如 600"
          />
          <label className="inline-flex select-none items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={options.autoHeight}
              disabled={disabled || options.skipResize}
              onChange={(e) => onChange({ autoHeight: e.target.checked, autoWidth: e.target.checked ? false : options.autoWidth })}
            />
            自动高度
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800">裁剪比例</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={options.ratioX}
            onChange={(e) => onChange({ ratioX: handleNumber(e.target.value) || 1 })}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <span className="text-sm text-slate-600">:</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={options.ratioY}
            onChange={(e) => onChange({ ratioY: handleNumber(e.target.value) || 1 })}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <p className="text-xs text-slate-500">用于裁剪后再缩放，保持比例一致。</p>
      </div>

      <div className="md:col-span-2 lg:col-span-3">
        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          <label className="inline-flex select-none items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={options.useHighQuality}
              disabled={disabled}
              onChange={(e) => onChange({ useHighQuality: e.target.checked })}
            />
            高质量缩放（pica）
          </label>
          <label className="inline-flex select-none items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={options.autoFocal}
              disabled={disabled || options.skipResize}
              onChange={(e) => onChange({ autoFocal: e.target.checked })}
            />
            自动识别焦点裁剪
          </label>
          <label className="inline-flex select-none items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={options.skipResize}
              disabled={disabled}
              onChange={(e) => onChange({ skipResize: e.target.checked })}
            />
            仅加水印/边框（不缩放）
          </label>
        </div>
      </div>

      <div className="md:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={disabled || isProcessing}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? '处理中...' : '应用尺寸并批量处理'}
        </button>
      </div>
    </form>
  )
}

export default ResizeForm

