package com.bigscreenbible.app;

import android.graphics.Color;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResultLauncher;
import androidx.browser.auth.AuthTabIntent;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean presentationEdgeToEdge;
    private boolean webEdgeToEdge;
    private int chromeColor = Color.rgb(17, 29, 55);
    private String pendingQuickAction;
    private String pendingSharedText;
    private int quickActionAttempts;
    private boolean shortcutResumed;
    private boolean shortcutInFlight;
    private final android.os.Handler shortcutHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable shortcutDelivery = this::deliverQuickAction;

    private void queueQuickAction(Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (Intent.ACTION_SEND.equals(action) && "text/plain".equals(intent.getType())) {
            CharSequence shared = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (shared != null && shared.length() > 0 && shared.length() <= 100000) {
                org.json.JSONArray inbox = sharedTextInbox();
                if (inbox.length() >= 10) {
                    android.widget.Toast.makeText(this, "Review pending imports in Big Screen Bible before sharing more.", android.widget.Toast.LENGTH_LONG).show();
                    return;
                }
                inbox.put(shared.toString());
                saveSharedTextInbox(inbox);
                if (pendingSharedText == null) pendingSharedText = inbox.optString(0);
                quickActionAttempts = 0;
                intent.removeExtra(Intent.EXTRA_TEXT);
                intent.setAction(Intent.ACTION_MAIN);
                deliverQuickAction();
            } else {
                android.widget.Toast.makeText(this, "Share devotional text of up to 100,000 characters, or use Import from text.", android.widget.Toast.LENGTH_LONG).show();
            }
            return;
        }
        Uri url = intent == null ? null : intent.getData();
        if (Intent.ACTION_VIEW.equals(action) && url != null && "https".equals(url.getScheme())
                && "bigscreenbible.com".equals(url.getHost()) && url.getUserInfo() == null
                && (url.getPort() == -1 || url.getPort() == 443)) {
            pendingQuickAction = url.toString();
            quickActionAttempts = 0;
            intent.setData(null);
            intent.setAction(Intent.ACTION_MAIN);
            shortcutHandler.removeCallbacks(shortcutDelivery);
            deliverQuickAction();
            return;
        }
        String prefix = "com.bigscreenbible.app.shortcut.";
        if (action == null || !action.startsWith(prefix)) return;
        String route = action.substring(prefix.length());
        if (!java.util.Arrays.asList("reader", "parallel", "games", "search").contains(route)) return;
        pendingQuickAction = route;
        quickActionAttempts = 0;
        // Consume the launch action so activity recreation cannot replay it.
        intent.setAction(Intent.ACTION_MAIN);
        shortcutHandler.removeCallbacks(shortcutDelivery);
        deliverQuickAction();
    }

    private org.json.JSONArray sharedTextInbox() {
        try { return new org.json.JSONArray(getSharedPreferences("passage_import", MODE_PRIVATE).getString("inbox", "[]")); }
        catch (org.json.JSONException error) { return new org.json.JSONArray(); }
    }

    private void saveSharedTextInbox(org.json.JSONArray inbox) {
        getSharedPreferences("passage_import", MODE_PRIVATE).edit().putString("inbox", inbox.toString()).commit();
    }

    private void deliverQuickAction() {
        if (!shortcutResumed || (pendingQuickAction == null && pendingSharedText == null) || shortcutInFlight
                || quickActionAttempts >= 200 || getBridge() == null) return;
        boolean sharing = pendingSharedText != null;
        String action = sharing ? pendingSharedText : pendingQuickAction;
        String currentUrl = getBridge().getWebView().getUrl();
        String host = currentUrl == null ? null : Uri.parse(currentUrl).getHost();
        if (!"bigscreenbible.com".equals(host) && !"localhost".equals(host)) {
            quickActionAttempts++;
            shortcutHandler.removeCallbacks(shortcutDelivery);
            shortcutHandler.postDelayed(shortcutDelivery, 300);
            return;
        }
        quickActionAttempts++;
        shortcutInFlight = true;
        String handler = sharing ? "bsbReceiveSharedText" : action.startsWith("https://") ? "bsbHandleSharedLink" : "bsbHandleQuickAction";
        getBridge().getWebView().evaluateJavascript(
            "window." + handler + "?.(" + org.json.JSONObject.quote(action) + ") === true", result -> {
                shortcutInFlight = false;
                if ("true".equals(result)) {
                    if (sharing && action.equals(pendingSharedText)) {
                        org.json.JSONArray inbox = sharedTextInbox();
                        org.json.JSONArray remaining = new org.json.JSONArray();
                        for (int i = 1; i < inbox.length(); i++) remaining.put(inbox.optString(i));
                        saveSharedTextInbox(remaining);
                        pendingSharedText = remaining.length() > 0 ? remaining.optString(0) : null;
                    }
                    else if (!sharing && action.equals(pendingQuickAction)) pendingQuickAction = null;
                }
                if ((pendingQuickAction != null || pendingSharedText != null) && shortcutResumed) {
                    shortcutHandler.removeCallbacks(shortcutDelivery);
                    shortcutHandler.postDelayed(shortcutDelivery, 300);
                }
            });
    }

    @Override
    public void onResume() {
        super.onResume();
        shortcutResumed = true;
        if (pendingSharedText == null) {
            org.json.JSONArray inbox = sharedTextInbox();
            pendingSharedText = inbox.length() > 0 ? inbox.optString(0) : null;
        }
        quickActionAttempts = 0;
        deliverQuickAction();
    }

    @Override
    public void onPause() {
        captureWidgetProgress();
        shortcutResumed = false;
        shortcutHandler.removeCallbacks(shortcutDelivery);
        super.onPause();
    }

    // Capture on backgrounding even when the live site predates the widget bridge.
    private void captureWidgetProgress() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        String value = getBridge().getWebView().getUrl();
        if (value == null) return;
        String host = Uri.parse(value).getHost();
        if (!"bigscreenbible.com".equals(host) && !"localhost".equals(host)) return;
        getBridge().getWebView().evaluateJavascript("JSON.stringify({...JSON.parse(localStorage.getItem('lw_reading_streak') || '{}'), background: localStorage.getItem('lw_widget_background') || null, favorite: localStorage.getItem('lw_widget_content') === 'favorite' ? JSON.parse(localStorage.getItem('lw_widget_favorite') || 'null') : null})", result -> {
            try {
                String raw = new org.json.JSONArray("[" + result + "]").optString(0, "{}");
                org.json.JSONObject saved = new org.json.JSONObject(raw);
                org.json.JSONArray input = saved.optJSONArray("days"), days = new org.json.JSONArray();
                if (input != null) for (int i = Math.max(0, input.length() - 400); i < input.length(); i++) days.put(input.getString(i));
                org.json.JSONObject snapshot = new org.json.JSONObject()
                    .put("current", Math.max(0, Math.min(saved.optInt("current", 0), 100000)))
                    .put("lastVisit", saved.optString("lastVisit", "")).put("days", days);
                String background = saved.optString("background", "");
                if (background.matches("#[0-9a-fA-F]{6}")) snapshot.put("background", background);
                org.json.JSONObject favorite = saved.optJSONObject("favorite");
                if (ScriptureWidgetProvider.validFavorite(favorite)) snapshot.put("favorite", favorite);
                android.content.SharedPreferences prefs = ScriptureWidgetProvider.prefs(this);
                if (!snapshot.toString().equals(prefs.getString("snapshot", ""))) {
                    prefs.edit().putString("snapshot", snapshot.toString()).apply();
                    ScriptureWidgetProvider.updateAll(this);
                }
            } catch (Exception ignored) { /* An uninitialized page has no check-in yet. */ }
        });
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        outState.putString("bsbPendingQuickAction", pendingQuickAction);
        super.onSaveInstanceState(outState);
    }

    private PluginCall authCall;
    private final ActivityResultLauncher<Intent> authLauncher =
        AuthTabIntent.registerActivityResultLauncher(this, result -> {
            if (result.resultCode == AuthTabIntent.RESULT_OK) {
                finishAuth(result.resultUri);
            } else if (authCall != null) {
                PluginCall call = authCall;
                authCall = null;
                call.reject("Google sign in canceled. Please try again.", "CANCELED");
            }
        });

    public void openAuth(PluginCall call, Uri url) {
        if (authCall != null) {
            call.reject("Google sign in is already open.");
            return;
        }
        authCall = call;
        try {
            new AuthTabIntent.Builder().build().launch(authLauncher, url, "com.bigscreenbible.app");
        } catch (Exception error) {
            authCall = null;
            call.reject("Google sign in could not open. Check that a browser is installed.");
        }
    }

    private boolean isAuthCallback(Uri url) {
        return url != null && "com.bigscreenbible.app".equals(url.getScheme())
            && "auth".equals(url.getHost()) && "/callback".equals(url.getPath())
            && url.getUserInfo() == null && url.getPort() == -1;
    }

    private void finishAuth(Uri url) {
        if (authCall == null) return; // Ignore unsolicited or stale callbacks.
        PluginCall call = authCall;
        authCall = null;
        if (!isAuthCallback(url)) {
            call.reject("Invalid sign-in callback.");
            return;
        }
        JSObject result = new JSObject();
        result.put("url", url.toString());
        call.resolve(result);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        // Custom Tabs fallback on browsers without Auth Tab support.
        if (isAuthCallback(intent.getData())) {
            finishAuth(intent.getData());
            return;
        }
        super.onNewIntent(intent);
        setIntent(intent);
        queueQuickAction(intent);
    }

    public void updateChrome(boolean presentation, int color, boolean darkIcons, boolean edgeToEdge) {
        presentationEdgeToEdge = presentation;
        webEdgeToEdge = edgeToEdge;
        chromeColor = color;
        View container = (View) getBridge().getWebView().getParent();
        container.setBackgroundColor(chromeColor);
        getWindow().setStatusBarColor(webEdgeToEdge ? Color.TRANSPARENT : chromeColor);
        getWindow().setNavigationBarColor(webEdgeToEdge ? Color.TRANSPARENT : chromeColor);
        if (android.os.Build.VERSION.SDK_INT >= 29) {
            getWindow().setNavigationBarContrastEnforced(!webEdgeToEdge);
            getWindow().setStatusBarContrastEnforced(!webEdgeToEdge);
        }
        WindowCompat.getInsetsController(getWindow(), container).setAppearanceLightStatusBars(darkIcons);
        WindowCompat.getInsetsController(getWindow(), container).setAppearanceLightNavigationBars(darkIcons);
        ViewCompat.requestApplyInsets(container);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(BSBWidgetPlugin.class);
        registerPlugin(BSBChromePlugin.class);
        registerPlugin(BSBPrintPlugin.class);
        registerPlugin(BSBSpeechPlugin.class);
        registerPlugin(BSBAuthPlugin.class);
        super.onCreate(savedInstanceState);
        if (savedInstanceState != null) pendingQuickAction = savedInstanceState.getString("bsbPendingQuickAction");
        queueQuickAction(getIntent());
        if (getBridge() == null) return;

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View container = (View) getBridge().getWebView().getParent();
        container.setBackgroundColor(Color.rgb(17, 29, 55));
        // The live page opts into edge-to-edge only when it supports app safe-area variables.
        // SystemBars CSS inset handling is disabled in capacitor.config.json.
        ViewCompat.setOnApplyWindowInsetsListener(container, (view, windowInsets) -> {
            Insets safe = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets keyboard = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            // Big Screen search sits at the top: let the IME cover the presentation
            // instead of resizing and re-centering scripture above it. Other modes
            // still resize so their inputs remain reachable above the keyboard.
            int keyboardPadding = presentationEdgeToEdge ? 0 : keyboard.bottom;
            float density = getResources().getDisplayMetrics().density;
            if (webEdgeToEdge) {
                // Keep the WebView behind system bars and, in Big Screen, the IME.
                view.setPadding(0, 0, 0, keyboardPadding);
                Insets taps = windowInsets.getInsets(WindowInsetsCompat.Type.tappableElement());
                Insets cutout = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout());
                Insets gestures = windowInsets.getInsets(WindowInsetsCompat.Type.mandatorySystemGestures());
                float left = Math.max(taps.left, cutout.left) / density;
                float right = Math.max(taps.right, cutout.right) / density;
                float top = safe.top / density;
                float bottom = keyboardPadding > 0 ? 0
                    : Math.max(Math.max(taps.bottom, cutout.bottom), gestures.bottom) / density;
                String key = left + ":" + top + ":" + right + ":" + bottom;
                getBridge().getWebView().evaluateJavascript(
                    "(()=>{const r=document.documentElement;if(r.dataset.androidInsets==='" + key + "')return;"
                    + "r.dataset.androidInsets='" + key + "';r.dataset.androidEdgeToEdge='true';"
                    + "r.style.setProperty('--app-safe-area-left','" + left + "px');"
                    + "r.style.setProperty('--app-safe-area-top','" + top + "px');"
                    + "r.style.setProperty('--app-safe-area-right','" + right + "px');"
                    + "r.style.setProperty('--app-safe-area-bottom','" + bottom + "px');"
                    + "window.dispatchEvent(new Event('bsb-insets-change'));})()", null);
            } else {
                // Compatibility for live pages older than the inset-aware layout.
                view.setPadding(presentationEdgeToEdge ? 0 : safe.left, safe.top,
                    presentationEdgeToEdge ? 0 : safe.right, Math.max(safe.bottom, keyboardPadding));
                float left = presentationEdgeToEdge ? safe.left / density : 0;
                float right = presentationEdgeToEdge ? safe.right / density : 0;
                getBridge().getWebView().evaluateJavascript(
                    "document.documentElement.style.setProperty('--android-safe-left','" + left + "px');"
                    + "document.documentElement.style.setProperty('--android-safe-right','" + right + "px');", null);
            }

            // Insets are handled by the container or explicit CSS variables. Avoid double padding
            // through CSS env(safe-area-inset-*), while preserving inset redispatch.
            return new WindowInsetsCompat.Builder(windowInsets)
                .setInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                    | WindowInsetsCompat.Type.ime(), Insets.NONE)
                .build();
        });
        ViewCompat.requestApplyInsets(container);
    }
}
