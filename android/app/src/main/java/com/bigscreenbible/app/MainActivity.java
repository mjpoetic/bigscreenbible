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
    private String pendingQuickAction;
    private int quickActionAttempts;
    private boolean shortcutResumed;
    private boolean shortcutInFlight;
    private final android.os.Handler shortcutHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable shortcutDelivery = this::deliverQuickAction;

    private void queueQuickAction(Intent intent) {
        String action = intent == null ? null : intent.getAction();
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

    private void deliverQuickAction() {
        if (!shortcutResumed || pendingQuickAction == null || shortcutInFlight
                || quickActionAttempts >= 200 || getBridge() == null) return;
        String action = pendingQuickAction;
        quickActionAttempts++;
        shortcutInFlight = true;
        getBridge().getWebView().evaluateJavascript(
            "window.bsbHandleQuickAction?.('" + action + "') === true", result -> {
                shortcutInFlight = false;
                if ("true".equals(result) && action.equals(pendingQuickAction)) pendingQuickAction = null;
                if (pendingQuickAction != null && shortcutResumed) {
                    shortcutHandler.removeCallbacks(shortcutDelivery);
                    shortcutHandler.postDelayed(shortcutDelivery, 300);
                }
            });
    }

    @Override
    public void onResume() {
        super.onResume();
        shortcutResumed = true;
        quickActionAttempts = 0;
        deliverQuickAction();
    }

    @Override
    public void onPause() {
        shortcutResumed = false;
        shortcutHandler.removeCallbacks(shortcutDelivery);
        super.onPause();
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(BSBPrintPlugin.class);
        registerPlugin(BSBAuthPlugin.class);
        super.onCreate(savedInstanceState);
        if (savedInstanceState != null) pendingQuickAction = savedInstanceState.getString("bsbPendingQuickAction");
        queueQuickAction(getIntent());
        if (getBridge() == null) return;

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View container = (View) getBridge().getWebView().getParent();
        container.setBackgroundColor(Color.rgb(17, 29, 55));
        // Own the safe viewport natively for every web mode, including fixed controls.
        // SystemBars CSS inset handling is disabled in capacitor.config.json.
        ViewCompat.setOnApplyWindowInsetsListener(container, (view, windowInsets) -> {
            Insets safe = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets keyboard = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top, safe.right, Math.max(safe.bottom, keyboard.bottom));

            // The WebView is already inset. Zero these values to avoid double padding
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
