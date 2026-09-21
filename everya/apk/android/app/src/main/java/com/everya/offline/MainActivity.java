package com.everya.offline;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

public class MainActivity extends Activity {
  private WebView web;
  private ProgressBar progress;
  private final String appUrl = BuildConfig.EVERYA_APP_URL;

  @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    FrameLayout root = new FrameLayout(this);
    web = new WebView(this);
    progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
    progress.setMax(100);
    root.addView(web, new FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT));
    FrameLayout.LayoutParams bar = new FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT, 6);
    root.addView(progress, bar);
    setContentView(root);

    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(true);
    settings.setMediaPlaybackRequiresUserGesture(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    settings.setLoadWithOverviewMode(true);
    settings.setUseWideViewPort(true);
    settings.setBuiltInZoomControls(false);
    settings.setDisplayZoomControls(false);

    CookieManager cookies = CookieManager.getInstance();
    cookies.setAcceptCookie(true);
    cookies.setAcceptThirdPartyCookies(web, true);

    web.addJavascriptInterface(new Bridge(), "EveryA");
    web.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onProgressChanged(WebView view, int newProgress) {
        progress.setProgress(newProgress);
        progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
      }
    });
    web.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        return false;
      }

      @Override
      public void onPageStarted(WebView view, String url, Bitmap favicon) {
        progress.setVisibility(View.VISIBLE);
      }

      @Override
      public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request != null && request.isForMainFrame()) {
          view.loadUrl("file:///android_asset/www/offline.html");
        }
      }
    });

    if (savedInstanceState != null) {
      web.restoreState(savedInstanceState);
    } else {
      web.loadUrl(appUrl);
    }
  }

  @Override
  protected void onSaveInstanceState(Bundle outState) {
    super.onSaveInstanceState(outState);
    web.saveState(outState);
  }

  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_BACK && web.canGoBack()) {
      web.goBack();
      return true;
    }
    return super.onKeyDown(keyCode, event);
  }

  private final class Bridge {
    @JavascriptInterface
    public void retry() {
      runOnUiThread(() -> web.loadUrl(appUrl));
    }

    @JavascriptInterface
    public String getAppUrl() {
      return appUrl;
    }
  }
}
