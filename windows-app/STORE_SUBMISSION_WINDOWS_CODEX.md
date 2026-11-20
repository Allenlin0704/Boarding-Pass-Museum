# Windows Codex 续办：Microsoft Store 提交

请在 Windows 电脑上继续完成 BoardingPassMuseum Desktop 的 Microsoft Store 包构建和现有草稿提审。**不要创建、运行或恢复任何 GitHub Actions workflow。**

## 仓库与分支

使用仓库分支 `codex/store-msixupload-build`：

https://github.com/Allenlin0704/Boarding-Pass-Museum/tree/codex/store-msixupload-build

项目位于 `windows-app/BoardingPassMuseum.sln`。不要合并到 main，也不要改网站、Worker、数据库或线上数据。可以在此分支内修复 Windows 打包问题；不要推送新的提交，除非用户另行要求。

## 目标产品与草稿

- Partner Center Store ID：`9N4ZQ6ZT3S4H`
- 现有草稿提交：`1152921505702404283`
- 包 Identity Name：`AllenLin.BoardingPassMuseumDesktop`
- Publisher：`CN=FC762D3E-BF10-4E9E-AF87-5DCA6792262A`
- Publisher Display Name：`Allen Lin`
- Display Name：`BoardingPassMuseum Desktop`
- 预期 PFN：`AllenLin.BoardingPassMuseumDesktop_sardb9jchg4yt`

不要选择旧的客户端或管理员端 Store 产品。正在草稿里的是错误包：`BoardingPassMuseum_2.0.0.0_x64.msixupload`，PFN 为 `allenlin.boardingpassmuseumdesktop_bzrxrpfk8cr0y`，Identity 错误。先构建并验证正确的新包，再在当前草稿中替换错误包。

## 构建和排障

当前分支已修复两项已知问题：移除了 WinUI 不接受的 `RequestedTheme="Default"`，并在包清单加入 `runFullTrust`。上次构建还报告 `0x80080213` 和生成的 `ForBundle\AppxManifest.xml` 中资源清单/`resources.pri` 不匹配。请在 Windows 上用 Visual Studio 的实际打包输出确认原因，修复后重新构建，不要仅凭 XML 静态检查判断通过。

1. 在 Visual Studio 打开 solution，恢复 NuGet，选择 Release / x64。
2. 用 Store association 向导关联上述现有产品，确认生成的包身份、发布者和 PFN 与本文件一致。
3. 使用 Visual Studio 的 **Create App Packages for Microsoft Store** 生成 `.msixupload`。不要用 Sideloading 包代替 Store 上传包，也不要手工伪造或改写包身份。
4. 检查包验证无错误，并确认包里包含应用图标、封面资源和正确的应用名称。
5. 在 Partner Center 的指定草稿中替换错误包。若 Partner Center 指出版本号已使用或必须递增，再按其提示更新版本并重建。
6. 核对所有草稿页面均完成、包验证通过后，继续提交该草稿进行认证。用户已授权完成提审。

## 边界

- 不触发任何 workflow，不使用 CI 来构建。
- 不修改现有两个独立 Store 产品，也不新建 Store 产品。
- 不部署网站、不改线上服务、不操作用户数据。
- 不请求或传递密码、API key、验证码或签名私钥。
- 若 Windows 构建仍失败，先把完整错误代码、失败步骤和生成的 manifest 关键片段记录下来，再继续针对性修复；不要上传不匹配的包。
