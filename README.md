# 832401215 Calculator Frontend

原生 HTML、CSS、JavaScript 前端。页面只负责输入和展示，计算结果与历史记录均来自后端 API。

## 技术栈

- HTML5
- CSS3
- JavaScript ES Modules
- Node.js 20+

## 环境要求

- Node.js 20+
- 已启动的后端 API

## 启动

先启动后端，再确认 `js/config.js` 中的 API 地址：

```javascript
globalThis.CALCULATOR_API_BASE_URL = 'http://127.0.0.1:8765';
```

然后运行：

```powershell
npm install
npm start
```

打开 `http://127.0.0.1:5500`。如果当前系统允许使用 `8000` 端口，也可以同步修改后端启动端口和这里的 API 地址。

## 测试

```powershell
npm test
```

## 后端对接

浏览器直接请求后端，跨域访问由后端 `CORS_ORIGINS` 控制。本地默认使用：

- 前端：`http://127.0.0.1:5500`
- 后端：`http://127.0.0.1:8765`

部署到 Vercel 后，将 `js/config.js` 中的地址改为后端公网 URL。

## 目录

- `js/api.js`：HTTP 请求封装
- `js/app.js`：页面状态和交互
- `js/config.js`：后端地址配置
- `server.mjs`：零依赖本地静态服务器
- `css/styles.css`：响应式页面样式
- `tests/`：前端自动化测试
