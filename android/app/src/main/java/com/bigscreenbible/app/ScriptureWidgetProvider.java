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
        JSONObject snapshot = new JSONObject(prefs(context).getString("snapshot", "{}"));
        JSONObject translated = snapshot.optJSONObject("daily");
        if (validFavorite(translated) && day(new Date()).equals(translated.optString("day"))) return translated;
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
    static boolean validFavorite(JSONObject item) {
        return item != null && !item.optString("reference").trim().isEmpty() && item.optString("reference").length() <= 100
            && !item.optString("text").trim().isEmpty() && item.optString("text").length() <= 2000 && item.optString("source").length() <= 40;
    }
    static JSONObject displayVerse(JSONObject daily, JSONObject snapshot, boolean lockScreen) {
        JSONObject favorite = snapshot.optJSONObject("favorite");
        return !lockScreen && validFavorite(favorite) ? favorite : daily;
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
        for (Class<?> provider : new Class<?>[]{ScriptureWidgetProvider.class, ReadingStreakWidgetProvider.class}) {
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, provider));
            for (int id : ids) update(context, manager, id);
        }
    }
    private static void update(Context context, AppWidgetManager manager, int id) {
        try {
            JSONObject verse = selectedVerse(context);
            JSONObject snapshot = new JSONObject(prefs(context).getString("snapshot", "{}"));
            Bundle options = manager.getAppWidgetOptions(id);
            boolean lockScreen = options.getInt(AppWidgetManager.OPTION_APPWIDGET_HOST_CATEGORY, 1) == 2;
            verse = displayVerse(verse, snapshot, lockScreen);
            android.appwidget.AppWidgetProviderInfo info = manager.getAppWidgetInfo(id);
            boolean streakOnly = info != null && info.provider.getClassName().equals(ReadingStreakWidgetProvider.class.getName());
            boolean compact = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250) < 220;
            int width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 330);
            int height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 160);
            RemoteViews views = renderSized(context, verse, snapshot, width, height, streakOnly);
            // Android 12+ supplies actual host sizes, including rotation and resizing.
            if (android.os.Build.VERSION.SDK_INT >= 31) {
                java.util.ArrayList<android.util.SizeF> sizes = options.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES);
                if (sizes != null && !sizes.isEmpty()) {
                    java.util.Map<android.util.SizeF, RemoteViews> layouts = new java.util.LinkedHashMap<>();
                    for (android.util.SizeF size : sizes) {
                        if (layouts.size() >= 4) break; // Bound total bitmap memory across layouts.
                        layouts.put(size, renderSized(context, verse, snapshot, (int)size.getWidth(), (int)size.getHeight(), streakOnly));
                    }
                    views = new RemoteViews(layouts);
                }
            }
            Uri url = Uri.parse("https://bigscreenbible.com/").buildUpon()
                .appendQueryParameter("ref", verse.optString("linkReference", verse.getString("reference")))
                .appendQueryParameter("mode", "reader")
                .appendQueryParameter("version", verse.optString("version", "KJV".equals(verse.optString("source")) ? "KJV" : "BSB"))
                .appendQueryParameter("verses", verse.optString("verses", "")).build();
            Intent intent = new Intent(Intent.ACTION_VIEW, url, context, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            manager.updateAppWidget(id, views);
        } catch (Exception error) { android.util.Log.w("BSBWidget", "Widget update failed", error); }
    }
    static RemoteViews renderSized(Context context, JSONObject verse, JSONObject snapshot, int width, int height, boolean streakOnly) throws Exception {
        RemoteViews views = streakOnly ? renderStreak(context, verse, snapshot, width < 220) : render(context, verse, snapshot, width < 220);
        applyAppearance(views, snapshot, width, height);
        if (!streakOnly) {
            // RemoteViews cannot reliably transmit a custom Typeface to a launcher.
            // Render only the verse to a bounded bitmap; keep native labels and spoken text.
            int w = Math.max(100, Math.min(width - 24, 760));
            int h = Math.max(16, Math.min(height - 88, 600));
            float scale = (float)Math.min(context.getResources().getDisplayMetrics().density, Math.sqrt(160000.0 / (w * h)));
            android.graphics.Bitmap bitmap = android.graphics.Bitmap.createBitmap(Math.max(1, (int)(w * scale)), Math.max(1, (int)(h * scale)), android.graphics.Bitmap.Config.ARGB_8888);
            android.graphics.Canvas canvas = new android.graphics.Canvas(bitmap);
            canvas.scale(scale, scale);
            android.text.TextPaint paint = new android.text.TextPaint(android.graphics.Paint.ANTI_ALIAS_FLAG);
            paint.setColor(widgetInk(context, snapshot));
            String family = snapshot.optString("fontFamily", "Literata");
            String file = "Lora".equals(family) ? "Lora-Regular.ttf" : "Inter".equals(family) ? "Inter-Regular.ttf"
                : "Source Sans 3".equals(family) ? "SourceSans3-Regular.ttf" : "Literata-Regular.ttf";
            try { paint.setTypeface(android.graphics.Typeface.createFromAsset(context.getAssets(), "widget-fonts/" + file)); }
            catch (RuntimeException error) { paint.setTypeface(android.graphics.Typeface.SERIF); }
            String text = verse.getString("text");
            android.text.StaticLayout layout = null;
            float fontScale = context.getResources().getConfiguration().fontScale;
            for (float size = width < 220 ? 18 : 22; size >= 11; size -= 0.5f) {
                paint.setTextSize(size * fontScale);
                layout = android.text.StaticLayout.Builder.obtain(text, 0, text.length(), paint, w).setIncludePad(false).build();
                if (layout.getHeight() <= h) break;
            }
            if (layout != null && layout.getHeight() > h) {
                paint.setTextSize(11 * fontScale);
                int lines = Math.max(1, (int)(h / paint.getFontSpacing()));
                layout = android.text.StaticLayout.Builder.obtain(text, 0, text.length(), paint, w).setIncludePad(false)
                    .setMaxLines(lines).setEllipsize(android.text.TextUtils.TruncateAt.END).setEllipsizedWidth(w).build();
            }
            if (layout != null) layout.draw(canvas);
            boolean custom = snapshot.optString("background", "").matches("#[0-9a-fA-F]{6}");
            int image = custom ? R.id.widget_verse_custom_image : R.id.widget_verse_image;
            // System mode uses an XML tint that resolves in the launcher's current
            // light/dark resources, rather than baking that color into the bitmap.
            views.setImageViewBitmap(image, bitmap);
            views.setViewVisibility(R.id.widget_verse_image, custom ? View.GONE : View.VISIBLE);
            views.setViewVisibility(R.id.widget_verse_custom_image, custom ? View.VISIBLE : View.GONE);
            views.setViewVisibility(R.id.widget_verse, View.GONE);
        }
        return views;
    }
    static int widgetInk(Context context, JSONObject snapshot) {
        String hex = snapshot.optString("background", "");
        if (!hex.matches("#[0-9a-fA-F]{6}")) return context.getResources().getColor(R.color.widget_ink, context.getTheme());
        int color = android.graphics.Color.parseColor(hex);
        double luminance = 0;
        double[] weights = {0.2126, 0.7152, 0.0722};
        int[] channels = {android.graphics.Color.red(color), android.graphics.Color.green(color), android.graphics.Color.blue(color)};
        for (int i = 0; i < 3; i++) {
            double c = channels[i] / 255.0;
            luminance += weights[i] * (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        }
        return luminance < 0.179 ? android.graphics.Color.WHITE : android.graphics.Color.BLACK;
    }
    static RemoteViews render(Context context, JSONObject verse, JSONObject snapshot, boolean compact) throws Exception {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.scripture_widget);
        views.setTextViewText(R.id.widget_verse, verse.getString("text"));
        views.setTextViewTextSize(R.id.widget_verse, TypedValue.COMPLEX_UNIT_SP, compact ? 17 : 21);
        // The weighted verse area grows with the host's actual size. Let its
        // measured height, rather than a fixed line cap, determine how much fits.
        views.setInt(R.id.widget_verse, "setMaxLines", Integer.MAX_VALUE);
        views.setTextViewText(R.id.widget_reference, verse.getString("reference") + ("Heartlight".equals(verse.optString("source")) ? "" : " · " + verse.getString("source")));
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
    static RemoteViews renderStreak(Context context, JSONObject verse, JSONObject snapshot, boolean compact) throws Exception {
        RemoteViews views = render(context, verse, snapshot, compact);
        views.setTextViewText(R.id.widget_heading, "BIG SCREEN BIBLE");
        views.setTextViewText(R.id.widget_streak, "Open Bible");
        views.setTextViewText(R.id.widget_today, "›");
        views.setTextViewText(R.id.widget_verse, context.getString(R.string.widget_streak_format, streak(snapshot)));
        views.setTextViewText(R.id.widget_reference, checked(snapshot, day(new Date())) ? "Read today ✓" : "A moment in Scripture");
        views.setContentDescription(R.id.widget_root, streak(snapshot) + " day reading streak. " + (checked(snapshot, day(new Date())) ? "Read today." : "Open your Bible."));
        return views;
    }
    static void applyAppearance(RemoteViews views, JSONObject snapshot, int width, int height) {
        String hex = snapshot.optString("background", "");
        if (!hex.matches("#[0-9a-fA-F]{6}")) return;
        int color = android.graphics.Color.parseColor(hex);
        double luminance = 0;
        double[] weights = {0.2126, 0.7152, 0.0722};
        int[] channels = {android.graphics.Color.red(color), android.graphics.Color.green(color), android.graphics.Color.blue(color)};
        for (int i = 0; i < 3; i++) {
            double c = channels[i] / 255.0;
            luminance += weights[i] * (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        }
        int ink = luminance < 0.179 ? android.graphics.Color.WHITE : android.graphics.Color.BLACK;
        // A bitmap background preserves rounded corners on older launchers too.
        int w = Math.max(150, Math.min(width, 800)), h = Math.max(110, Math.min(height, 800));
        android.graphics.Bitmap bitmap = android.graphics.Bitmap.createBitmap(w, h, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Paint paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        paint.setColor(color);
        new android.graphics.Canvas(bitmap).drawRoundRect(0, 0, w, h, 24, 24, paint);
        views.setImageViewBitmap(R.id.widget_color_background, bitmap);
        views.setViewVisibility(R.id.widget_color_background, View.VISIBLE);
        views.setInt(R.id.widget_root, "setBackgroundColor", android.graphics.Color.TRANSPARENT);
        for (int id : new int[]{R.id.widget_heading, R.id.widget_verse, R.id.widget_reference, R.id.widget_streak, R.id.widget_week, R.id.widget_today}) views.setTextColor(id, ink);
        views.setInt(R.id.widget_divider, "setBackgroundColor", (ink & 0x00ffffff) | 0x33000000);
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
