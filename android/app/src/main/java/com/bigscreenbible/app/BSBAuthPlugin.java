package com.bigscreenbible.app;

import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BSBAuth")
public class BSBAuthPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        String value = call.getString("url");
        Uri url = value == null ? null : Uri.parse(value);
        if (url == null || !"https".equals(url.getScheme())
            || !"yyldnatfhzobyeqnvqjv.supabase.co".equals(url.getHost())
            || !"/auth/v1/authorize".equals(url.getPath())
            || url.getUserInfo() != null || (url.getPort() != -1 && url.getPort() != 443)) {
            call.reject("Invalid sign-in URL.");
            return;
        }
        getActivity().runOnUiThread(() -> ((MainActivity) getActivity()).openAuth(call, url));
    }
}
