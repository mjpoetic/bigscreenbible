package com.bigscreenbible.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ScriptureWidgetProvider extends AppWidgetProvider {
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();
    static SharedPreferences prefs(Context context) { return context.getSharedPreferences("bsb_widget", Context.MODE_PRIVATE); }
    static String day(Date date) { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(date); }
    static JSONObject verse(String ref, String text, String source) throws Exception {
        return new JSONObject().put("reference", ref).put("text", text).put("source", source).put("day", day(new Date()));
    }
    static JSONObject catalog(Context context) throws Exception {
        try (InputStream stream = context.getResources().openRawResource(R.raw.widget_catalog)) {
            return new JSONObject(read(stream));
        }
    }
    private static String read(InputStream stream) throws Exception {
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int count;
        while ((count = stream.read(buffer)) != -1) {
            if (out.size() + count > 1000000) throw new java.io.IOException("Widget response too large");
            out.write(buffer, 0, count);
        }
        return out.toString("UTF-8");
    }
    static JSONObject selectedVerse(Context context) throws Exception {
        JSONObject saved = new JSONObject(prefs(context).getString("dailyVerse", "{}"));
        String today = day(new Date());
        if (today.equals(saved.optString("day"))) return saved;
        JSONObject data = catalog(context);
        JSONObject selected = data.getJSONObject("seasonal").optJSONObject(today.substring(5));
        if (selected == null) {
            Calendar calendar = Calendar.getInstance();
            JSONArray anchors = data.getJSONArray("anchors");
            selected = anchors.getJSONObject((calendar.get(Calendar.DAY_OF_YEAR) - 1) % anchors.length());
        }
        return verse(selected.getString("reference"), selected.getString("text"), "KJV");
    }
    static boolean checked(JSONObject snapshot, String date) {
        if (date.equals(snapshot.optString("lastVisit"))) return true;
        JSONArray days = snapshot.optJSONArray("days");
        if (days != null) for (int i = 0; i < days.length(); i++) if (date.equals(days.optString(i))) return true;
        return false;
    }
    static int streak(JSONObject snapshot) {
        Calendar yesterday = Calendar.getInstance(); yesterday.add(Calendar.DAY_OF_YEAR, -1);
        return checked(snapshot, day(new Date())) || day(yesterday.getTime()).equals(snapshot.optString("lastVisit"))
            ? snapshot.optInt("current", 0) : 0;
    }
    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, ScriptureWidgetProvider.class));
        for (int id : ids) update(context, manager, id);
    }
    private static void update(Context context, AppWidgetManager manager, int id) {
        try {
            JSONObject verse = selectedVerse(context);
            JSONObject snapshot = new JSONObject(prefs(context).getString("snapshot", "{}"));
            Bundle options = manager.getAppWidgetOptions(id);
            boolean compact = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250) < 220;
            RemoteViews views = render(context, verse, snapshot, compact);
            Uri url = Uri.parse("https://bigscreenbible.com/").buildUpon()
                .appendQueryParameter("ref", verse.getString("reference"))
                .appendQueryParameter("mode", "reader")
                .appendQueryParameter("version", "KJV".equals(verse.optString("source")) ? "KJV" : "BSB").build();
            Intent intent = new Intent(Intent.ACTION_VIEW, url, context, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            manager.updateAppWidget(id, views);
        } catch (Exception error) { android.util.Log.w("BSBWidget", "Widget update failed", error); }
    }
    static RemoteViews render(Context context, JSONObject verse, JSONObject snapshot, boolean compact) throws Exception {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.scripture_widget);
        views.setTextViewText(R.id.widget_verse, verse.getString("text"));
        views.setTextViewTextSize(R.id.widget_verse, TypedValue.COMPLEX_UNIT_SP, compact ? 17 : 21);
        views.setInt(R.id.widget_verse, "setMaxLines", compact ? 4 : 3);
        views.setTextViewText(R.id.widget_reference, verse.getString("reference") + " · " + verse.getString("source"));
        views.setTextViewText(R.id.widget_streak, context.getString(R.string.widget_streak_format, streak(snapshot)));
        boolean today = checked(snapshot, day(new Date()));
        views.setTextViewText(R.id.widget_today, context.getString(today ? R.string.widget_checked : R.string.widget_open));
        views.setViewVisibility(R.id.widget_week, compact ? View.GONE : View.VISIBLE);
        Calendar date = Calendar.getInstance();
        int offset = (date.get(Calendar.DAY_OF_WEEK) - date.getFirstDayOfWeek() + 7) % 7;
        date.add(Calendar.DAY_OF_YEAR, -offset);
        StringBuilder week = new StringBuilder();
        for (int i = 0; i < 7; i++) {
            week.append(checked(snapshot, day(date.getTime())) ? "● " : "○ ");
            date.add(Calendar.DAY_OF_YEAR, 1);
        }
        views.setTextViewText(R.id.widget_week, week.toString().trim());
        views.setContentDescription(R.id.widget_root, "Verse of the Day. " + verse.getString("text") + ". " + verse.getString("reference") + ". " + streak(snapshot) + " day streak. " + (today ? "Checked in today." : "Open Bible."));
        return views;
    }
    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) update(context, manager, id);
        // Small bounded fetch: finish well within the broadcast receiver deadline.
        final PendingResult pending = goAsync();
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                JSONObject data = catalog(context);
                String requestedDay = day(new Date());
                connection = (HttpURLConnection) new URL(data.getString("endpoint")).openConnection();
                connection.setConnectTimeout(2500); connection.setReadTimeout(2500);
                connection.setRequestProperty("apikey", data.getString("publishableKey"));
                if (connection.getResponseCode() != 200) return;
                JSONObject item;
                try (InputStream stream = connection.getInputStream()) { item = new JSONObject(read(stream)); }
                String ref = item.getString("reference"), text = item.getString("verseText");
                if (ref.isEmpty() || ref.length() > 100 || text.isEmpty() || text.length() > 2000 || !requestedDay.equals(day(new Date()))) return;
                prefs(context).edit().putString("dailyVerse", verse(ref, text, "Heartlight").toString()).apply();
                updateAll(context);
            } catch (Exception ignored) { /* The bundled daily verse remains available offline. */ }
            finally { if (connection != null) connection.disconnect(); pending.finish(); }
        });
    }
    @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) { update(context, manager, id); }
    @Override public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (Intent.ACTION_DATE_CHANGED.equals(action) || Intent.ACTION_TIME_CHANGED.equals(action)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(action) || Intent.ACTION_LOCALE_CHANGED.equals(action)) updateAll(context);
    }
}
