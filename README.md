# Bulk Image Studio

本项目提供纯浏览器端的批量图片裁剪、缩放、重命名、水印与多格式导出能力，所有处理均在本地完成，不会上传图片。

## 功能特性
- 拖拽/多选上传，支持 JPG/PNG/WebP/AVIF
- 手动焦点裁剪（卡片内直接拖拽缩放），支持比例约束
- 智能焦点裁剪（smartcrop，可选）
- 高质量缩放（pica）
- 边框与文字水印（可调颜色、字号、位置、透明度）
- 重命名规则：`ORIGINAL-NAME`、`{width}`、`{height}`、序号占位 `xxx`
- 导出：逐个下载、ZIP 打包下载、保存到本地文件夹（需支持 File System Access）

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

## 主要脚本
- `npm run dev`：本地开发（Vite）
- `npm run build`：类型检查 + 生产构建
- `npm run preview`：构建结果本地预览
- `npm run lint`：ESLint 检查

## 目录结构
- `src/App.tsx`：页面与交互主入口
- `src/components/InlineCropper.tsx`：内联手动裁剪组件
- `src/components/UploadPanel.tsx`：上传/拖拽
- `src/components/ResizeForm.tsx`：尺寸/比例/高级选项
- `src/components/ExportButton.tsx`：ZIP 打包下载
- `src/utils/imageProcessor.ts`：裁剪、缩放、水印、格式转换、重命名管线

## 打包上传到 GitHub 的建议
1. 确保 `npm run build` 通过（已在本地验证）。
2. 保持 `.gitignore`，避免提交 `node_modules`、`dist`、日志等。
3. 在 GitHub 新建仓库后执行：
   ```bash
   git init
   git add .
   git commit -m "init: bulk image studio"
   git branch -M main
   git remote add origin <your_repo_url>
   git push -u origin main
   ```

## 依赖
- React 19 / Vite 7 / TypeScript 5
- `react-easy-crop`（手动裁剪）
- `pica`（高质量缩放）
- `smartcrop`（智能焦点裁剪）
- `jszip`、`file-saver`（打包/下载）

## 说明
- 项目完全本地执行，无服务器端。
- 若保存到文件夹功能在浏览器受限，请使用 ZIP 导出或逐个下载。
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
