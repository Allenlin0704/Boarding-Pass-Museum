using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using Windows.System;

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

    public MainWindow()
    {
        InitializeComponent();
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
        StatusText.Text = args.IsSuccess ? "安全连接到 bpmuseum.org.cn" : "页面暂时不可用，请检查网络后重试。";
    }

    private void GalleryButton_Click(object sender, RoutedEventArgs e) => Navigate(GalleryUri);
    private void AdminButton_Click(object sender, RoutedEventArgs e) => Navigate(AdminUri);

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
