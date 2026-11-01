package com.bigscreenbible.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.RemoteViews;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class WidgetRenderingTest {
    @Test public void fontsAndSizesInflateAndDraw() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        JSONObject verse = ScriptureWidgetProvider.verse("1 Peter 1:24–25", "All men are like grass, and all their glory is like the flowers of the field; the grass withers and the flowers fall, but the word of the Lord stands forever.", "BSB");
        for (String font : new String[]{"Literata", "Lora", "Inter", "Source Sans 3"}) {
            for (int[] size : new int[][]{{330, 150}, {330, 110}, {150, 150}, {330, 340}}) {
                JSONObject snapshot = new JSONObject().put("fontFamily", font).put("background", "#111d37").put("current", 12);
                RemoteViews remote = ScriptureWidgetProvider.renderSized(context, verse, snapshot, size[0], size[1], false);
                InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
                    View view = remote.apply(context, new FrameLayout(context));
                    float density = context.getResources().getDisplayMetrics().density;
                    int width = (int)(size[0] * density), height = (int)(size[1] * density);
                    view.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
                    view.layout(0, 0, width, height);
                    ImageView image = view.findViewById(R.id.widget_verse_custom_image);
                    assertEquals(View.VISIBLE, image.getVisibility());
                    assertNotNull(image.getDrawable());
                    assertTrue("Verse needs visible space", image.getHeight() > 0);
                    assertEquals(View.GONE, view.findViewById(R.id.widget_verse).getVisibility());
                    assertTrue(((TextView)view.findViewById(R.id.widget_reference)).getText().toString().contains("BSB"));
                    assertTrue(view.findViewById(R.id.widget_root).getContentDescription().toString().contains("All men"));
                    Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                    view.draw(new Canvas(bitmap));
                    try (java.io.FileOutputStream out = new java.io.FileOutputStream(new java.io.File(context.getExternalFilesDir(null), "widget-" + font.replace(' ', '-') + "-" + size[0] + "x" + size[1] + ".png"))) {
                        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
                    } catch (java.io.IOException error) { throw new RuntimeException(error); }
                });
            }
        }
    }
    @Test public void translationExpiresAndFavoritesRespectLockScreen() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String original = ScriptureWidgetProvider.prefs(context).getString("snapshot", "{}");
        try {
            JSONObject daily = ScriptureWidgetProvider.verse("John 3:16", "Translated wording", "BSB");
            ScriptureWidgetProvider.prefs(context).edit().putString("snapshot", new JSONObject().put("daily", daily).toString()).commit();
            assertEquals("Translated wording", ScriptureWidgetProvider.selectedVerse(context).getString("text"));
            daily.put("day", "2000-01-01");
            ScriptureWidgetProvider.prefs(context).edit().putString("snapshot", new JSONObject().put("daily", daily).toString()).commit();
            assertNotEquals("Translated wording", ScriptureWidgetProvider.selectedVerse(context).getString("text"));
            JSONObject favorite = ScriptureWidgetProvider.verse("Psalm 23:1", "Favorite wording", "KJV");
            JSONObject snapshot = new JSONObject().put("favorite", favorite);
            assertEquals(favorite, ScriptureWidgetProvider.displayVerse(daily, snapshot, false));
            assertEquals(daily, ScriptureWidgetProvider.displayVerse(daily, snapshot, true));
        } finally { ScriptureWidgetProvider.prefs(context).edit().putString("snapshot", original).commit(); }
    }
    @Test public void deviceModeResolvesVerseTintInHostTheme() throws Exception {
        Context base = InstrumentationRegistry.getInstrumentation().getTargetContext();
        JSONObject verse = ScriptureWidgetProvider.verse("Psalm 23:1", "The Lord is my shepherd.", "KJV");
        RemoteViews remote = ScriptureWidgetProvider.renderSized(base, verse, new JSONObject(), 330, 150, false);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            for (int mode : new int[]{android.content.res.Configuration.UI_MODE_NIGHT_NO, android.content.res.Configuration.UI_MODE_NIGHT_YES}) {
                android.content.res.Configuration config = new android.content.res.Configuration(base.getResources().getConfiguration());
                config.uiMode = (config.uiMode & ~android.content.res.Configuration.UI_MODE_NIGHT_MASK) | mode;
                Context host = base.createConfigurationContext(config);
                View view = remote.apply(host, new FrameLayout(host));
                ImageView image = view.findViewById(R.id.widget_verse_image);
                assertEquals(View.VISIBLE, image.getVisibility());
                assertEquals(host.getResources().getColor(R.color.widget_ink, host.getTheme()), image.getImageTintList().getDefaultColor());
            }
        });
    }
    @Test public void systemAndCustomColorsApply() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals(android.graphics.Color.WHITE, ScriptureWidgetProvider.widgetInk(context, new JSONObject().put("background", "#000000")));
        assertEquals(android.graphics.Color.BLACK, ScriptureWidgetProvider.widgetInk(context, new JSONObject().put("background", "#ffffff")));
        assertEquals(context.getResources().getColor(R.color.widget_ink, context.getTheme()), ScriptureWidgetProvider.widgetInk(context, new JSONObject()));
    }
}
