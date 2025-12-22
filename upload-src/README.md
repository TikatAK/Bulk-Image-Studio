# 🖼️ Bulk Image Studio

纯前端的批量图片裁剪、缩放、重命名、水印与多格式导出工具，**所有处理均在浏览器本地完成，离线可用，不上传任何数据**。


## 目录
- [功能特性](#功能特性)
- [使用方法](#使用方法)
- [快速开始](#快速开始)
- [离线运行](#离线运行)
- [导出与重命名](#导出与重命名)
- [开发脚本](#开发脚本)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [常见问题](#常见问题)

## 功能特性
- ✅ 批量上传：拖拽/多选，支持 JPG / PNG / WebP / AVIF
- ✅ 裁剪与缩放：手动焦点裁剪、智能焦点裁剪（smartcrop）、高质量缩放（pica）
- ✅ 样式与水印：边框、文字水印（颜色/字号/位置/透明度可调）
- ✅ 重命名规则：`ORIGINAL-NAME`、`{width}`、`{height}`、序号占位 `xxx`
- ✅ 导出方式：逐个下载、ZIP 打包、保存到本地文件夹（浏览器需支持 File System Access）
- 🔒 隐私友好：全程本地处理，不触网

## 使用方法
1. 打开页面后上传图片（拖拽或点击选择）。  
2. 设置尺寸、比例或裁剪方式（手动/智能），选择高质量缩放与否。  
3. 配置边框、水印、重命名模式。  
4. 处理并导出：逐个下载、ZIP 打包，或保存到本地文件夹（支持时）。  

## 快速开始
```bash
npm install
npm run dev
```

构建与预览：
```bash
npm run build
npm run preview
```

## 离线运行
- 所有图像处理在浏览器内完成，不依赖任何在线接口。  
- 首次需联网执行 `npm install` 安装依赖；之后可携带 `node_modules` 在无网环境直接 `npm run dev` / `npm run build`。  
- 若目标环境完全无网，建议提前打包或缓存依赖随项目分发。  

## 导出与重命名
- 输出格式：保持原格式 / JPEG / WebP / AVIF（质量 1-100）。  
- 文件名占位示例：`ORIGINAL-NAME_{width}x{height}_xxx` → `photo_512x512_001.jpg`。  
- 保存到文件夹需浏览器支持 File System Access；若系统文件夹受限，可在该目录下新建子文件夹再保存。  

## 开发脚本
- `npm run dev`：本地开发（Vite）
- `npm run build`：类型检查 + 生产构建
- `npm run preview`：本地预览构建产物
- `npm run lint`：ESLint 检查

## 技术栈
- 前端：React 19 + TypeScript 5
- 构建：Vite 7
- UI：Tailwind CSS（@tailwindcss/postcss）
- 图像处理：Canvas API + `pica`（高质量缩放）+ `smartcrop`（智能裁剪）+ `react-easy-crop`（手动裁剪）
- 打包下载：`jszip`、`file-saver`

## 目录结构
- `src/App.tsx`：页面与交互主入口
- `src/components/InlineCropper.tsx`：内联手动裁剪
- `src/components/UploadPanel.tsx`：上传与拖拽
- `src/components/ResizeForm.tsx`：尺寸、比例及高级选项
- `src/components/ExportButton.tsx`：ZIP 打包下载
- `src/utils/imageProcessor.ts`：裁剪/缩放/水印/重命名管线

## 常见问题
- **是否会将图片上传到服务器？** 不会，全部处理在浏览器本地完成。  
- **浏览器不支持保存到文件夹怎么办？** 使用 ZIP 导出或逐个下载。  
- **需要联网吗？** 除首次安装依赖外，运行与处理均不依赖网络。  