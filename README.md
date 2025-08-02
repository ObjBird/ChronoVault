# ChronoVault - 时间性记忆封印系统

ChronoVault 是一个基于区块链技术的时间锁定记忆封印系统，允许用户将珍贵的记忆、情感和想法封存在时间胶囊中，通过智能合约确保内容在指定时间前无法被访问。

## 🌟 主要特性

- **时间锁定**: 设定未来的解锁时间，创建真正的时间胶囊
- **区块链存储**: 基于 Monad 区块链的不可篡改存储
- **多媒体支持**: 支持文字、图片、音频、视频等多种格式
- **情感封印**: 记录创建时的心境和情感状态
- **炫酷动画**: 现代化的用户界面和流畅的动画效果
- **响应式设计**: 完美适配各种设备和屏幕尺寸

## 🛠 技术栈

- **前端**: React 18 + Framer Motion + Lucide Icons
- **样式**: CSS-in-JS + Glassmorphism 设计
- **区块链**: Ethers.js + Monad Chain
- **打包工具**: Webpack 5
- **部署**: Cloudflare Pages

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- MetaMask 钱包

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm start
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

构建文件将输出到 `dist` 目录

## 📁 项目结构

```
ChronoVault/
├── public/                 # 静态资源
│   ├── index.html         # HTML 模板
│   └── favicon.ico        # 网站图标
├── src/                   # 源代码
│   ├── components/        # React 组件
│   │   └── Layout.js      # 页面布局组件
│   ├── pages/            # 页面组件
│   │   ├── HomePage.js    # 首页
│   │   ├── CreateSealPage.js  # 创建封印页面
│   │   ├── VaultPage.js   # 金库页面
│   │   └── SealDetailPage.js  # 封印详情页面
│   ├── context/          # React Context
│   │   └── Web3Context.js # Web3 状态管理
│   ├── services/         # 服务层
│   │   └── fileService.js # 文件上传服务
│   ├── styles/           # 样式文件
│   │   └── global.css    # 全局样式
│   ├── App.js            # 主应用组件
│   └── index.js          # 应用入口
├── package.json          # 项目配置
├── webpack.config.js     # Webpack 配置
├── wrangler.toml         # Cloudflare 部署配置
└── README.md            # 项目说明
```

## 🔧 配置说明

### 智能合约配置

在 `src/context/Web3Context.js` 中配置智能合约：

```javascript
// 合约地址（需要替换为实际部署的合约地址）
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';

// 合约 ABI（需要替换为实际的合约 ABI）
const CONTRACT_ABI = [
  // ... 合约 ABI
];
```

### 后端服务配置

在 `src/services/fileService.js` 中配置后端API：

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.chronovault.example.com';
```

### 环境变量

创建 `.env` 文件：

```env
REACT_APP_API_URL=https://your-backend-api.com
REACT_APP_CONTRACT_ADDRESS=0xYourContractAddress
REACT_APP_CHAIN_ID=0x15b3
```

## 🚢 部署到 Cloudflare Pages

### 方法 1: 通过 Git 集成

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Pages 中连接仓库
3. 配置构建设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: `18`

### 方法 2: 使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署项目
wrangler pages publish dist --project-name=chronovault
```

## 🎨 UI/UX 特性

- **Glassmorphism 设计**: 现代的毛玻璃效果
- **渐变动画**: 流畅的色彩过渡
- **粒子背景**: 动态的背景粒子效果
- **响应式布局**: 适配移动端和桌面端
- **加载状态**: 优雅的加载和错误状态
- **时间倒计时**: 实时显示解锁倒计时

## 🔐 智能合约接口

项目需要以下智能合约方法：

```solidity
// 创建封印
function createSeal(string memory _content, uint256 _unlockTime, string memory _mediaIds) 
    public returns (uint256);

// 获取封印信息
function getSeal(uint256 _sealId) 
    public view returns (string memory content, uint256 unlockTime, string memory mediaIds, address creator, bool isUnlocked);

// 获取用户的所有封印
function getUserSeals(address _user) 
    public view returns (uint256[] memory);
```

## 📱 功能说明

### 创建封印

1. 填写封印标题和内容
2. 选择解锁时间（支持快速选择）
3. 上传媒体文件（可选）
4. 设置情感标签和标签
5. 连接钱包并提交到区块链

### 查看金库

1. 显示所有创建的封印
2. 支持搜索和筛选功能
3. 区分已锁定和已解锁状态
4. 显示解锁倒计时

### 封印详情

1. 查看完整的封印信息
2. 实时倒计时显示
3. 解锁后可查看内容和媒体文件
4. 支持下载媒体文件

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Ethers.js](https://docs.ethers.io/) - 以太坊库
- [Lucide React](https://lucide.dev/) - 图标库
- [Cloudflare Pages](https://pages.cloudflare.com/) - 静态网站托管

---

**注意**: 这是一个前端演示项目，需要配合相应的智能合约和后端服务才能完整运行。合约地址、API 端点等配置需要根据实际部署情况进行修改。 