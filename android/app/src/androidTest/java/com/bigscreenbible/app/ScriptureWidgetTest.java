package com.bigscreenbible.app;

import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.TextView;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
import org.json.JSONArray;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Calendar;
import java.util.Date;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class ScriptureWidgetTest {
    @Test public void progressExpiresAndLinksHaveDailyContent() throws Exception {
        JSONObject snapshot = new JSONObject().put("current", 12).put("lastVisit", ScriptureWidgetProvider.day(new Date())).put("days", new JSONArray());
        assertTrue(ScriptureWidgetProvider.checked(snapshot, ScriptureWidgetProvider.day(new Date())));
        assertEquals(12, ScriptureWidgetProvider.streak(snapshot));
        Calendar old = Calendar.getInstance(); old.add(Calendar.DAY_OF_YEAR, -2);
        snapshot.put("lastVisit", ScriptureWidgetProvider.day(old.getTime()));
        assertEquals(0, ScriptureWidgetProvider.streak(snapshot));
        snapshot.put("days", new JSONArray().put(ScriptureWidgetProvider.day(new Date())));
        assertTrue(ScriptureWidgetProvider.checked(snapshot, ScriptureWidgetProvider.day(new Date())));
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        JSONObject verse = ScriptureWidgetProvider.selectedVerse(context);
        assertFalse(verse.getString("text").isEmpty());
        assertFalse(verse.getString("reference").isEmpty());
        assertEquals(ScriptureWidgetProvider.day(new Date()), verse.getString("day"));
    }
    @Test public void nativeLayoutsRenderAtCompactAndMediumSizes() {
        Context base = InstrumentationRegistry.getInstrumentation().getTargetContext();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            for (boolean dark : new boolean[]{false, true}) for (int width : new int[]{150, 180, 330}) for (int height : new int[]{150, 180, 360, 500}) {
                Configuration config = new Configuration(base.getResources().getConfiguration());
                config.uiMode = (config.uiMode & ~Configuration.UI_MODE_NIGHT_MASK) | (dark ? Configuration.UI_MODE_NIGHT_YES : Configuration.UI_MODE_NIGHT_NO);
                Context context = base.createConfigurationContext(config);
                RemoteViews remote;
                try {
                    JSONObject verse = ScriptureWidgetProvider.verse("2 Timothy 3:16-17", "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.", "Heartlight");
                    JSONObject snapshot = new JSONObject().put("current", 12).put("lastVisit", ScriptureWidgetProvider.day(new Date()));
                    remote = ScriptureWidgetProvider.render(context, verse, snapshot, width < 220);
                    ScriptureWidgetProvider.applyAppearance(remote, snapshot.put("background", dark ? "#102030" : "#ffefcc"), width, height);
                } catch (Exception error) { throw new AssertionError(error); }
                View view = remote.apply(context, null);
                float density = context.getResources().getDisplayMetrics().density;
                int pxWidth = Math.round(width * density), pxHeight = Math.round(height * density);
                view.measure(View.MeasureSpec.makeMeasureSpec(pxWidth, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(pxHeight, View.MeasureSpec.EXACTLY));
                view.layout(0, 0, pxWidth, pxHeight);
                TextView verse = view.findViewById(R.id.widget_verse);
                TextView ref = view.findViewById(R.id.widget_reference);
                assertEquals("Resizing must not retain a fixed verse line cap", Integer.MAX_VALUE, verse.getMaxLines());
                if (height >= 360) assertTrue("Tall widgets reveal more than four lines", verse.getHeight() / verse.getLineHeight() > 4);
                assertTrue("Verse has usable height", verse.getHeight() > 0);
                assertTrue("Verse cannot overlap reference", verse.getBottom() <= ref.getTop());
                assertTrue("Footer stays within widget", view.findViewById(R.id.widget_today).getHeight() > 0);
                android.view.ViewGroup root = view.findViewById(R.id.widget_root);
                View footer = root.getChildAt(root.getChildCount() - 1);
                assertTrue("Footer does not overflow minimum height", footer.getBottom() <= pxHeight - view.getPaddingBottom());
                Bitmap bitmap = Bitmap.createBitmap(pxWidth, pxHeight, Bitmap.Config.ARGB_8888);
                view.draw(new Canvas(bitmap));
                File output = new File(base.getCacheDir(), "widget-" + width + "x" + height + (dark ? "-dark" : "-light") + ".png");
                try (FileOutputStream stream = new FileOutputStream(output)) { bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream); }
                catch (Exception error) { throw new AssertionError(error); }
                bitmap.recycle();
            }
        });
    }
}
