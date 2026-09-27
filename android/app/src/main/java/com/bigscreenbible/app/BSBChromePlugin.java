package com.bigscreenbible.app;

import android.graphics.Color;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BSBChrome")
public class BSBChromePlugin extends Plugin {
    @PluginMethod
    public void sync(PluginCall call) {
        final int color;
        try {
            color = Color.parseColor(call.getString("color", "#111d37"));
        } catch (IllegalArgumentException error) {
            call.reject("Invalid chrome color");
            return;
        }
        getActivity().runOnUiThread(() -> {
            ((MainActivity) getActivity()).updateChrome(
                call.getBoolean("presentation", false), color, call.getBoolean("darkIcons", false));
            call.resolve();
        });
    }
}
