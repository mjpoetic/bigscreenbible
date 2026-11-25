package com.bigscreenbible.app;

import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.provider.Settings;
import android.view.HapticFeedbackConstants;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BSBHaptics")
public class BSBHapticsPlugin extends Plugin {
    @SuppressWarnings("deprecation")
    private Vibrator vibrator() {
        if (Build.VERSION.SDK_INT >= 31) {
            VibratorManager manager = getContext().getSystemService(VibratorManager.class);
            return manager == null ? null : manager.getDefaultVibrator();
        }
        return getContext().getSystemService(Vibrator.class);
    }

    private boolean canAdjustStrength(Vibrator vibrator) {
        return Build.VERSION.SDK_INT >= 26 && vibrator != null
            && vibrator.hasVibrator() && vibrator.hasAmplitudeControl();
    }

    @PluginMethod
    public void getCapabilities(PluginCall call) {
        JSObject result = new JSObject();
        result.put("adjustable", canAdjustStrength(vibrator()));
        call.resolve(result);
    }

    @PluginMethod
    @SuppressWarnings("deprecation")
    public void impact(PluginCall call) {
        double requested = call.getDouble("intensity", 0.6);
        if (!Double.isFinite(requested) || requested <= 0) {
            call.resolve();
            return;
        }
        float intensity = (float) Math.min(1, requested);
        boolean soft = call.getBoolean("soft", false);
        Vibrator vibrator = vibrator();
        if (!canAdjustStrength(vibrator)) {
            getActivity().runOnUiThread(() -> {
                getBridge().getWebView().performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                call.resolve();
            });
            return;
        }

        if (Settings.System.getInt(getContext().getContentResolver(), Settings.System.HAPTIC_FEEDBACK_ENABLED, 1) != 0) {
            VibrationEffect effect = createEffect(vibrator, intensity, soft);
            if (Build.VERSION.SDK_INT >= 33) {
                vibrator.vibrate(effect, VibrationAttributes.createForUsage(VibrationAttributes.USAGE_TOUCH));
            } else {
                vibrator.vibrate(effect, new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION).build());
            }
        }
        call.resolve();
    }

    private VibrationEffect createEffect(Vibrator vibrator, float intensity, boolean soft) {
        if (Build.VERSION.SDK_INT >= 30) {
            int primitive = soft ? VibrationEffect.Composition.PRIMITIVE_TICK : VibrationEffect.Composition.PRIMITIVE_CLICK;
            if (vibrator.areAllPrimitivesSupported(primitive)) {
                return VibrationEffect.startComposition().addPrimitive(primitive, intensity).compose();
            }
        }
        int amplitude = Math.max(1, Math.round(intensity * 255));
        return VibrationEffect.createOneShot(soft ? 8 : 12, amplitude);
    }
}
