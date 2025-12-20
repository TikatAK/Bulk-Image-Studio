import pica from 'pica'

// smartcrop 未提供 TS 类型，这里直接忽略类型检查。
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import smartcrop from 'smartcrop'

export type CropRegion = {
  x: number
  y: number
  width: number
  height: number
}

export type ProcessOptions = {
  targetWidth: number
  targetHeight: number
  autoWidth: boolean
  autoHeight: boolean
  ratioX: number
  ratioY: number
  useHighQuality: boolean
  autoFocal: boolean
  skipResize: boolean
  outputFormat: 'original' | 'jpeg' | 'webp' | 'avif'
  quality: number // 1 - 100
  borderColor: string
  borderThickness: number
  watermarkText: string
  watermarkSize: number
  watermarkOpacity: number // 0 - 1
  watermarkPosition: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  renamePattern: string
  startNumber: number
}

export type ProcessedImage = {
  name: string
  blob: Blob
  width: number
  height: number
  mimeType: string
}

type SmartCropResult = {
  topCrop: { x: number; y: number; width: number; height: number }
}

export const fileKey = (file: File) => `${file.name}-${file.lastModified}`

const picaInstance = pica()

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg']

const mimeToExtension = (mime: string) => {
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('avif')) return 'avif'
  return 'img'
}

const pickMime = (fileType: string, format: ProcessOptions['outputFormat']): string => {
  if (format === 'jpeg') return 'image/jpeg'
  if (format === 'webp') return 'image/webp'
  if (format === 'avif') return 'image/avif'
  // 保持原格式，若无法识别则回退 jpg
  return ACCEPTED_TYPES.includes(fileType) ? fileType : 'image/jpeg'
}

const loadSourceImage = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if ('createImageBitmap' in window) {
    return await createImageBitmap(file)
  }

  return await new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.decoding = 'async'
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取图片文件'))
    }
    image.src = url
  })
}

const cleanupImage = (source: ImageBitmap | HTMLImageElement) => {
  if ('close' in source && typeof source.close === 'function') {
    source.close()
  }
}

const toCanvas = (source: ImageBitmap | HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  ctx.drawImage(source, 0, 0)
  return canvas
}

const centerCrop = (canvas: HTMLCanvasElement, width: number, height: number) => {
  const sx = Math.max(0, Math.floor((canvas.width - width) / 2))
  const sy = Math.max(0, Math.floor((canvas.height - height) / 2))
  const target = document.createElement('canvas')
  target.width = Math.round(width)
  target.height = Math.round(height)
  const ctx = target.getContext('2d')
  if (!ctx) throw new Error('无法创建裁剪画布')
  ctx.drawImage(canvas, sx, sy, width, height, 0, 0, width, height)
  return target
}

const cropWithFocal = async (canvas: HTMLCanvasElement, width: number, height: number, useAutoFocal: boolean) => {
  if (!useAutoFocal) {
    return centerCrop(canvas, width, height)
  }

  const result = (await smartcrop.crop(canvas, { width, height })) as SmartCropResult
  const { x, y, width: cw, height: ch } = result.topCrop
  const target = document.createElement('canvas')
  target.width = Math.round(cw)
  target.height = Math.round(ch)
  const ctx = target.getContext('2d')
  if (!ctx) throw new Error('无法创建智能裁剪画布')
  ctx.drawImage(canvas, x, y, cw, ch, 0, 0, cw, ch)
  return target
}

const resizeCanvas = async (source: HTMLCanvasElement, width: number, height: number, useHighQuality: boolean) => {
  if (width <= 0 || height <= 0) throw new Error('宽高必须大于 0')
  if (useHighQuality) {
    const target = document.createElement('canvas')
    target.width = Math.round(width)
    target.height = Math.round(height)
    await picaInstance.resize(source, target)
    return target
  }

  const target = document.createElement('canvas')
  target.width = Math.round(width)
  target.height = Math.round(height)
  const ctx = target.getContext('2d')
  if (!ctx) throw new Error('无法创建缩放画布')
  ctx.drawImage(source, 0, 0, width, height)
  return target
}

const applyBorder = (canvas: HTMLCanvasElement, color: string, thickness: number) => {
  if (thickness <= 0) return canvas
  const target = document.createElement('canvas')
  target.width = Math.round(canvas.width + thickness * 2)
  target.height = Math.round(canvas.height + thickness * 2)
  const ctx = target.getContext('2d')
  if (!ctx) throw new Error('无法创建边框画布')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, target.width, target.height)
  ctx.drawImage(canvas, thickness, thickness)
  return target
}

const applyWatermark = (canvas: HTMLCanvasElement, text: string, size: number, opacity: number, position: ProcessOptions['watermarkPosition']) => {
  if (!text.trim() || size <= 0 || opacity <= 0) return canvas
  const target = document.createElement('canvas')
  target.width = canvas.width
  target.height = canvas.height
  const ctx = target.getContext('2d')
  if (!ctx) throw new Error('无法创建水印画布')
  ctx.drawImage(canvas, 0, 0)
  ctx.font = `${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`
  ctx.fillStyle = `rgba(255,255,255,${opacity})`
  ctx.textBaseline = 'bottom'
  ctx.textAlign = 'right'

  const padding = Math.max(8, size / 2)
  let x = target.width - padding
  let y = target.height - padding

  if (position === 'top-left') {
    x = padding
    y = size + padding / 2
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  } else if (position === 'top-right') {
    x = target.width - padding
    y = size + padding / 2
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
  } else if (position === 'bottom-left') {
    x = padding
    y = target.height - padding
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
  } else if (position === 'center') {
    x = target.width / 2
    y = target.height / 2 + size / 2
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
  }

  ctx.fillText(text, x, y)
  return target
}

const applyManualCrop = (canvas: HTMLCanvasElement, region: CropRegion) => {
  const { x, y, width, height } = region
  const target = document.createElement('canvas')
  target.width = Math.max(1, Math.round(width))
  target.height = Math.max(1, Math.round(height))
  const ctx = target.getContext('2d')
  if (!ctx) throw new Error('无法创建手动裁剪画布')
  ctx.drawImage(canvas, x, y, width, height, 0, 0, target.width, target.height)
  return target
}

const getOutputName = (file: File, width: number, height: number, mimeType: string, pattern: string, index: number, startNumber: number) => {
  const baseName = file.name.replace(/\.[^/.]+$/, '')
  const extension = mimeToExtension(mimeType)
  const sequence = (startNumber || 0) + index
  const paddedSequence = (match: string) => sequence.toString().padStart(match.length, '0')

  const fallback = `${baseName}-${width}x${height}`
  const safePattern = pattern.trim() || fallback

  let name = safePattern
    .replace(/ORIGINAL-NAME/gi, baseName)
    .replace(/{width}/gi, `${width}`)
    .replace(/{height}/gi, `${height}`)
    .replace(/x{2,}/gi, (match) => paddedSequence(match))

  if (!name.trim()) name = fallback
  return `${name}.${extension}`
}

const toBlobSafe = async (canvas: HTMLCanvasElement, mimeType: string, quality: number) => {
  const normalizedQuality = Number.isFinite(quality) ? Math.min(Math.max(quality, 1), 100) / 100 : 0.8
  try {
    return await picaInstance.toBlob(canvas, mimeType, normalizedQuality)
  } catch (err) {
    console.warn('指定格式导出失败，回退为 PNG', err)
    return await picaInstance.toBlob(canvas, 'image/png')
  }
}

export const processImages = async (
  files: File[],
  options: ProcessOptions,
  manualCrops?: Record<string, CropRegion>,
): Promise<ProcessedImage[]> => {
  const validFiles = files.filter((file) => ACCEPTED_TYPES.includes(file.type))
  if (!validFiles.length) {
    throw new Error('请选择支持的图片（JPEG/PNG/WebP/AVIF）')
  }

  const ratioX = Math.max(1, options.ratioX || 1)
  const ratioY = Math.max(1, options.ratioY || 1)

  const results: ProcessedImage[] = []

  for (let index = 0; index < validFiles.length; index += 1) {
    const file = validFiles[index]
    const source = await loadSourceImage(file)
    let baseCanvas = toCanvas(source)

    const targetMime = pickMime(file.type, options.outputFormat)

    const manualCrop = manualCrops?.[fileKey(file)]
    if (manualCrop) {
      baseCanvas = applyManualCrop(baseCanvas, manualCrop)
    }

    let targetWidth = Math.round(options.targetWidth)
    let targetHeight = Math.round(options.targetHeight)

    // 自动计算宽或高
    if (options.autoWidth && !options.autoHeight) {
      targetWidth = Math.round(targetHeight * (ratioX / ratioY))
    } else if (options.autoHeight && !options.autoWidth) {
      targetHeight = Math.round(targetWidth * (ratioY / ratioX))
    }

    const desiredRatio = ratioX / ratioY
    const sourceRatio = baseCanvas.width / baseCanvas.height

    if (!options.skipResize && (targetWidth <= 0 || targetHeight <= 0)) {
      cleanupImage(source)
      throw new Error('请设置大于 0 的目标宽高')
    }

    let cropWidth = baseCanvas.width
    let cropHeight = baseCanvas.height

    if (!options.skipResize) {
      if (sourceRatio > desiredRatio) {
        cropHeight = baseCanvas.height
        cropWidth = Math.round(cropHeight * desiredRatio)
      } else {
        cropWidth = baseCanvas.width
        cropHeight = Math.round(cropWidth / desiredRatio)
      }
    }

    const croppedCanvas = options.skipResize
      ? baseCanvas
      : await cropWithFocal(baseCanvas, cropWidth, cropHeight, options.autoFocal)

    const resizedCanvas = options.skipResize
      ? croppedCanvas
      : await resizeCanvas(croppedCanvas, targetWidth, targetHeight, options.useHighQuality)

    const withBorder = applyBorder(resizedCanvas, options.borderColor, options.borderThickness)
    const finalCanvas = applyWatermark(
      withBorder,
      options.watermarkText,
      options.watermarkSize,
      options.watermarkOpacity,
      options.watermarkPosition,
    )

    const blob = await toBlobSafe(finalCanvas, targetMime, options.quality)
    const outputName = getOutputName(file, finalCanvas.width, finalCanvas.height, targetMime, options.renamePattern, index, options.startNumber)

    results.push({
      name: outputName,
      blob,
      width: finalCanvas.width,
      height: finalCanvas.height,
      mimeType: targetMime,
    })

    cleanupImage(source)
  }

  return results
}

