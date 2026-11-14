# Windows 端 Codex 交接：BoardingPassMuseum 桌面客户端

请在 Windows 上接手并完成 `windows-app` 内的桌面应用构建、修复和运行验证。目标是一款 Microsoft Store 可打包的 Windows 应用，在同一个窗口内提供“线上展厅”和“管理入口”两个工作区。当前实现复用正式网站，站点、API、数据库和用户数据都不应因这项工作而改变。

## 项目位置

- Solution：`windows-app/BoardingPassMuseum.sln`
- WinUI 项目：`windows-app/BoardingPassMuseum/BoardingPassMuseum.csproj`
- 界面：`App.xaml`、`MainWindow.xaml`
- 导航与 WebView2 安全策略：`MainWindow.xaml.cs`
- MSIX 清单：`Package.appxmanifest`
- 图标和启动图：`BoardingPassMuseum/Assets/`
- 当前本地说明：`windows-app/README.md`

这是 WinUI 3 + WebView2 桌面外壳。展厅默认打开 `https://bpmuseum.org.cn/`；“管理入口”打开 `https://admin.bpmuseum.org.cn/admin-login.html`。SA 登录后仍应由网站现有逻辑跳转 SA 工作台，不能增加绕过站点认证的入口。

## 先做构建检查

1. 确认 Windows 已装 Visual Studio 2026、Windows application development workload、.NET 10 SDK、Windows SDK 10.0.26100 或更新版本，以及 WebView2 Evergreen Runtime。
2. 在 Visual Studio 打开 `BoardingPassMuseum.sln`，恢复 NuGet 套件，选择 `x64` 与 `Debug`，先构建并启动。
3. 如 IDE 构建失败，可先从项目目录运行：

   ```powershell
   dotnet --info
   dotnet restore .\BoardingPassMuseum.sln
   dotnet build .\BoardingPassMuseum.sln -c Debug -p:Platform=x64
   ```

4. 逐个修复编译错误，只改 `windows-app/`。不要为绕过错误而修改网站、Worker、迁移、线上配置或安全权限。
5. 成功运行后再构建 Release。需要检查 MSIX 时，在 Visual Studio 使用 Create App Packages / Sideloading 创建本地测试包；没有签名证书时按 Visual Studio 指引生成测试证书。

本项目目前只是 Mac 上的源码和静态配置检查通过；此前没有在 Windows 编译或运行过。请把“构建通过”和“实机运行通过”分别记录，不能把 XML 解析当成编译成功。

## 必须遵守的安全和范围

- 不发布网站、不部署 Worker、不运行生产数据库迁移、不改线上数据。
- 不改 `public/`、`worker/`、`migrations/`、网站商店链接，也不提交或推送代码。
- 仓库已有大量与本任务无关的未提交变更。不要 `git add .`、不要清理或覆盖其他修改；如需提交，只选 `windows-app/`，并先告知用户。
- 不登录或测试真实用户账号，不提交真实展品、不审批、不删改公告。未登录状态可完成大部分 UI/导航验证；涉及账号动作时停在确认前。
- 不从前端 `localStorage` 信任管理员/SA 身份。权限始终由现有服务端会话和 Worker 判断。
- 现有 Microsoft Store 客户端与管理端 Product ID 分别是 `9NJCJPTFGMG7`、`9P8JMZJ5J9TR`。本项目是合并后的新包，清单中的 `BoardingPassMuseum.Desktop` / `CN=BoardingPassMuseum` 是占位身份。**不要关联、替换、提交或更新任何现有 Store 产品**；改包身份/发布都先交用户决定。
- 保持网站/PWA 和正式版行为不变。当前目标只是 Windows 桌面端整合客户端及管理入口。

## 手动测试清单

请记录每项通过/失败和可复现步骤：

1. 应用首次打开后显示展厅；展厅链接、图片、筛选和页面滚动正常。
2. 左侧“管理入口”打开专属 `admin.bpmuseum.org.cn/admin-login.html`，不把人送到普通客户端登录页。返回“线上展厅”后客户端仍能正常使用。
3. 浏览器后退、刷新和网站内跳转工作正常；页面加载失败时“重新连接”可恢复。
4. 暗色/浅色 Windows 主题下原生外壳对比度可读，logo、Store 方形图标、宽图和启动图比例正常。
5. HTTPS 站点页面在应用内打开；非本站的普通 HTTPS 链接在默认浏览器打开；HTTP 和未知 scheme 被拦截。确认允许的 Apple、Microsoft、GitHub 登录跳转及返回回调可工作。Cloudflare Turnstile 应能显示；若 WebView2 或 Turnstile 限制嵌入式环境，记录实际错误并提出安全修正。
6. 网站现有的两个 Store 按钮在合并应用内分别回到展厅/管理入口，不应意外再打开旧客户端 Store 页面；其他 Store URL 才交由 Windows 处理。
7. 用无敏感信息的测试图片打开投稿上传和图像处理器，确认文件选择器及编辑流程能打开。只验证到提交前，不提交真实投稿。
8. 验证 WebView2 运行时缺失或网络不可用时，错误提示清楚且重试可用；不要把运行时缺失误报为普通网络故障。

## 需要回报给用户的结果

- 修改过的 `windows-app/` 文件清单和修复原因。
- Debug/Release 构建结果、启动结果、上述测试结果。
- 若需要用户提供 Store 身份、签名、登录、验证码或其他资料，说明精确阻塞点；不要索要密码或密钥。
- 当前阶段只交付可运行/可测试的本地桌面应用源码和构建产物。未获明确后续指示前，不上传 Microsoft Store、不替换现有商店条目、不推送仓库、不部署网站。
