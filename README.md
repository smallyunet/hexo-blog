# smallyu的博客（疯狂版）

这是 [smallyu](https://crazy.smallyu.net) 的个人博客源码仓库。基于 [Hexo](https://hexo.io/) 框架构建，使用自定义的 `yinwang` 主题。

## 简介

- **博客名称**: smallyu的博客（疯狂版）
- **作者**: smallyu
- **地址**: https://crazy.smallyu.net
- **框架**: Hexo v6.3.0
- **主题**: yinwang

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) (建议使用 LTS 版本)
- [Git](https://git-scm.com/)

### 安装依赖

```bash
npm install
```

### 本地运行

启动本地服务器，默认访问地址为 `http://localhost:4000`。

```bash
npx hexo server
```

### 构建生成

生成静态文件到 `docs` 目录（在 `_config.yml` 中配置了 `public_dir: docs`）。

```bash
npx hexo generate
```

### 清理缓存

清理缓存文件 (`db.json`) 和已生成的静态文件。

```bash
npx hexo clean
```

## 目录结构

```text
.
├── _config.yml         # 站点配置文件
├── package.json        # 项目依赖配置
├── scaffolds/          # 文章模版
├── source/             # 博客文章源码 (Markdown)
│   ├── _posts/         # 文章目录
│   └── ...
├── themes/             # 主题目录
│   └── yinwang/        # 当前使用的主题
└── docs/               # 生成的静态网页文件 (GitHub Pages)
```

## 插件列表

本项目使用了以下 Hexo 插件：

- `hexo-generator-feed`: 生成 Atom/RSS 订阅源
- `hexo-generator-sitemap`: 生成站点地图
- `hexo-renderer-marked`: Markdown 渲染引擎
- `hexo-renderer-pug`: Pug 模版渲染引擎
- `hexo-wordcount-sy`: 字数统计

## 版权说明

本博客所有文章由 smallyu 撰写，保留所有权利。
