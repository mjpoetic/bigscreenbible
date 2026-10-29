package com.bigscreenbible.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "BSBWidget")
public class BSBWidgetPlugin extends Plugin {
    @PluginMethod
    public void sync(PluginCall call) {
        try {
            JSONObject snapshot = new JSONObject();
            snapshot.put("current", Math.max(0, Math.min(call.getInt("current", 0), 100000)));
            snapshot.put("lastVisit", call.getString("lastVisit", ""));
            JSONArray input = call.getArray("days", new com.getcapacitor.JSArray());
            JSONArray days = new JSONArray();
            for (int i = Math.max(0, input.length() - 400); i < input.length(); i++) days.put(input.getString(i));
            snapshot.put("days", days);
            JSONObject favorite = call.getObject("favorite");
            if (ScriptureWidgetProvider.validFavorite(favorite)) snapshot.put("favorite", favorite);
            String background = call.getString("background", "");
            if (background.matches("#[0-9a-fA-F]{6}")) snapshot.put("background", background);
            android.content.SharedPreferences prefs = ScriptureWidgetProvider.prefs(getContext());
            String value = snapshot.toString();
            boolean changed = !value.equals(prefs.getString("snapshot", ""));
            android.content.SharedPreferences.Editor editor = prefs.edit().putString("snapshot", value);
            editor.apply();
            if (changed) ScriptureWidgetProvider.updateAll(getContext());
            call.resolve();
        } catch (Exception error) { call.reject("Could not share widget data", error); }
    }
}
