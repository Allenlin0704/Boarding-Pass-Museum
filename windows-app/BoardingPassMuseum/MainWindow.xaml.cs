using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using Windows.System;
using Windows.Storage;

namespace BoardingPassMuseum;

public sealed partial class MainWindow : Window
{
    private static readonly Uri GalleryUri = new("https://bpmuseum.org.cn/");
    private static readonly Uri AdminUri = new("https://admin.bpmuseum.org.cn/admin-login.html");
    private static readonly HashSet<string> TrustedHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "bpmuseum.org.cn",
        "www.bpmuseum.org.cn",
        "admin.bpmuseum.org.cn",
        "api.bpmuseum.org.cn",
        "github.com",
        "appleid.apple.com",
        "accounts.google.com",
        "login.microsoftonline.com",
        "challenges.cloudflare.com"
    };

    private bool _ready;
    private string _language = "zh-CN";

    public MainWindow()
    {
        InitializeComponent();
        LanguagePicker.Items.Add("简体中文");
        LanguagePicker.Items.Add("繁體中文");
        LanguagePicker.Items.Add("English");
        _language = ApplicationData.Current.LocalSettings.Values["language"] as string ?? "zh-CN";
        LanguagePicker.SelectedIndex = _language == "zh-TW" ? 1 : _language == "en" ? 2 : 0;
        ApplyLanguage();
        SiteView.NavigationStarting += SiteView_NavigationStarting;
        SiteView.NavigationCompleted += SiteView_NavigationCompleted;
        SiteView.CoreWebView2Initialized += SiteView_CoreWebView2Initialized;
        _ = InitializeBrowserAsync();
    }

    private async Task InitializeBrowserAsync()
    {
        try
        {
            await SiteView.EnsureCoreWebView2Async();
            _ready = true;
            SiteView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            SiteView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            SiteView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            SiteView.CoreWebView2.NewWindowRequested += CoreWebView2_NewWindowRequested;
            await SiteView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync("""
                (() => {
                    const hidePwaInstall = () => {
                        const labels = ['安装应用', '安裝應用程式', '添加到主屏幕', '加入主畫面', 'Install app', 'Install this site as an app'];
                        document.querySelectorAll('a, button, [role="button"], [role="menuitem"]').forEach((node) => {
                            const text = `${node.innerText || ''} ${node.getAttribute('aria-label') || ''} ${node.getAttribute('title') || ''}`.replace(/\s+/g, ' ').trim();
                            if (!labels.some((label) => text.toLowerCase().includes(label.toLowerCase()))) return;
                            const target = node.closest('li, .dropdown-item, [role="menuitem"]') || node;
                            target.style.setProperty('display', 'none', 'important');
                        });
                    };
                    new MutationObserver(hidePwaInstall).observe(document, { childList: true, subtree: true });
                    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hidePwaInstall, { once: true });
                    else hidePwaInstall();
                })();
                """);
            SiteView.Source = GalleryUri;
        }
        catch
        {
            ShowConnectionFailure();
        }
    }

    private void SiteView_CoreWebView2Initialized(WebView2 sender, CoreWebView2InitializedEventArgs args)
    {
        if (args.Exception is not null) ShowConnectionFailure();
    }

    private async void SiteView_NavigationStarting(WebView2 sender, CoreWebView2NavigationStartingEventArgs args)
    {
        if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out var uri))
        {
            args.Cancel = true;
            return;
        }

        if (uri.Scheme == "ms-windows-store")
        {
            args.Cancel = true;
            HandleExistingStoreLink(uri);
            return;
        }

        if (uri.Scheme is "mailto" or "weixin")
        {
            args.Cancel = true;
            try { await Launcher.LaunchUriAsync(uri); }
            catch { StatusText.Text = "此链接无法打开，请在浏览器或微信中访问。"; }
            return;
        }

        if (uri.Scheme != Uri.UriSchemeHttps)
        {
            args.Cancel = true;
            return;
        }

        if (TrustedHosts.Contains(uri.Host)) return;

        args.Cancel = true;
        try { await Launcher.LaunchUriAsync(uri); }
        catch { StatusText.Text = "此链接无法打开，请复制链接后在浏览器中访问。"; }
    }

    private async void CoreWebView2_NewWindowRequested(CoreWebView2 sender, CoreWebView2NewWindowRequestedEventArgs args)
    {
        args.Handled = true;
        if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var uri))
        {
            if (uri.Scheme == "ms-windows-store") HandleExistingStoreLink(uri);
            else if (uri.Scheme is "mailto" or "weixin") await Launcher.LaunchUriAsync(uri);
            else if (uri.Scheme == Uri.UriSchemeHttps && TrustedHosts.Contains(uri.Host)) SiteView.Source = uri;
            else if (uri.Scheme == Uri.UriSchemeHttps) await Launcher.LaunchUriAsync(uri);
        }
    }

    private void SiteView_NavigationCompleted(WebView2 sender, CoreWebView2NavigationCompletedEventArgs args)
    {
        FailurePanel.Visibility = args.IsSuccess ? Visibility.Collapsed : Visibility.Visible;
        BackButton.IsEnabled = args.IsSuccess && SiteView.CanGoBack;
        var en = _language == "en";
        var tw = _language == "zh-TW";
        StatusText.Text = args.IsSuccess
            ? en ? "Secure connection to bpmuseum.org.cn" : tw ? "已安全連線至 bpmuseum.org.cn" : "安全连接到 bpmuseum.org.cn"
            : en ? "The page is unavailable. Check your network and retry." : tw ? "頁面暫時無法使用，請檢查網路後重試。" : "页面暂时不可用，请检查网络后重试。";
    }

    private void GalleryButton_Click(object sender, RoutedEventArgs e) => Navigate(GalleryUri);
    private void AdminButton_Click(object sender, RoutedEventArgs e) => Navigate(AdminUri);

    private void LanguagePicker_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (LanguagePicker.SelectedIndex < 0) return;
        _language = LanguagePicker.SelectedIndex == 1 ? "zh-TW" : LanguagePicker.SelectedIndex == 2 ? "en" : "zh-CN";
        ApplicationData.Current.LocalSettings.Values["language"] = _language;
        ApplyLanguage();
    }

    private void ApplyLanguage()
    {
        var en = _language == "en";
        var tw = _language == "zh-TW";
        WorkspaceText.Text = en ? "Workspace" : tw ? "工作區" : "工作区";
        GalleryLabel.Text = en ? "Online Gallery" : tw ? "線上展廳" : "线上展厅";
        AdminLabel.Text = en ? "Admin Console" : tw ? "管理入口" : "管理入口";
        BackButton.Content = en ? "Back" : "返回";
        RefreshButton.Content = en ? "Refresh" : tw ? "重新整理" : "刷新";
        RetryButton.Content = en ? "Reconnect" : tw ? "重新連線" : "重新连接";
        TaglineText.Text = en ? "Keep every takeoff. Preserve every journey." : tw ? "收藏每一次起飛，保存每一段旅程" : "收藏每一次起飞，保存每一段旅程";
        AdminNoteText.Text = en ? "Sign in through the official BoardingPassMuseum admin site. All privileges are verified by the server." : tw ? "管理端請透過 BoardingPassMuseum 官方管理網域登入，權限由伺服器驗證。" : "管理端请通过 BoardingPassMuseum 官方管理域名登录，权限由服务器验证。";
        FailureTitleText.Text = en ? "Unable to connect to BoardingPassMuseum" : tw ? "暫時無法連接 BoardingPassMuseum" : "暂时无法连接 BoardingPassMuseum";
        FailureBodyText.Text = en ? "Check your network and try again. Your account and submissions remain on the website." : tw ? "請檢查網路後重試。你的帳戶與投稿仍保存在網站服務端。" : "请检查网络后重试。你的账户和投稿数据仍保存在网站服务端。";
        StatusText.Text = en ? "Secure connection to bpmuseum.org.cn" : tw ? "已安全連線至 bpmuseum.org.cn" : "安全连接到 bpmuseum.org.cn";
    }

    private void Navigate(Uri uri)
    {
        if (_ready) SiteView.Source = uri;
    }

    private void HandleExistingStoreLink(Uri uri)
    {
        // The web pages still advertise the two existing Store listings. Inside the
        // combined app, route those legacy links to the matching workspace instead.
        var query = uri.Query;
        if (query.Contains("9P8JMZJ5J9TR", StringComparison.OrdinalIgnoreCase)) Navigate(AdminUri);
        else if (query.Contains("9NJCJPTFGMG7", StringComparison.OrdinalIgnoreCase)) Navigate(GalleryUri);
        else _ = Launcher.LaunchUriAsync(uri);
    }

    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        if (SiteView.CanGoBack) SiteView.GoBack();
    }

    private void RefreshButton_Click(object sender, RoutedEventArgs e)
    {
        FailurePanel.Visibility = Visibility.Collapsed;
        if (_ready) SiteView.Reload();
        else _ = InitializeBrowserAsync();
    }

    private void ShowConnectionFailure() => FailurePanel.Visibility = Visibility.Visible;
}
