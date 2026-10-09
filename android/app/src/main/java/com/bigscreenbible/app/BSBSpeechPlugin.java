package com.bigscreenbible.app;

import android.media.AudioAttributes;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(name = "BSBSpeech")
public class BSBSpeechPlugin extends Plugin {
    private TextToSpeech engine;
    private boolean ready, failed, paused, destroyed;
    private final ArrayList<PluginCall> waiting = new ArrayList<>();
    private String requestId, text, token;
    private String requestOwner = "";
    private int offset, chunkStart, chunkEnd;
    private long generation;

    @Override public void load() {
        getActivity().runOnUiThread(() -> {
            engine = new TextToSpeech(getContext(), result -> getActivity().runOnUiThread(() -> {
                if (destroyed) return;
                ready = result == TextToSpeech.SUCCESS;
                failed = !ready;
                if (ready) {
                    engine.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
                    engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override public void onStart(String id) { dispatch(id, "start", -1); }
                        @Override public void onDone(String id) { dispatch(id, "done", -1); }
                        @Override public void onError(String id) { dispatch(id, "error", -1); }
                        @Override public void onError(String id, int code) { dispatch(id, "error", -1); }
                        @Override public void onRangeStart(String id, int start, int end, int frame) { dispatch(id, "range", start); }
                    });
                }
                for (PluginCall call : waiting) resolveVoices(call);
                waiting.clear();
            }));
        });
    }

    private void emit(String id, String type) {
        JSObject event = new JSObject(); event.put("id", id); event.put("type", type);
        notifyListeners("speechEvent", event);
    }

    private void dispatch(String id, String type, int start) {
        getActivity().runOnUiThread(() -> {
            if (destroyed || token == null || !token.equals(id) || requestId == null || paused) return;
            if (type.equals("range")) { offset = chunkStart + start; return; }
            if (type.equals("done") && chunkEnd < text.length()) {
                offset = chunkEnd; speakChunk(); return;
            }
            String request = requestId;
            if (type.equals("done") || type.equals("error")) { requestId = null; token = null; }
            emit(request, type);
        });
    }

    private void speakChunk() {
        chunkStart = offset;
        chunkEnd = Math.min(text.length(), offset + TextToSpeech.getMaxSpeechInputLength() - 1);
        if (chunkEnd < text.length()) {
            int space = text.lastIndexOf(' ', chunkEnd);
            if (space > chunkStart) chunkEnd = space + 1;
        }
        token = requestId + ":" + (++generation);
        if (engine.speak(text.substring(chunkStart, chunkEnd), TextToSpeech.QUEUE_FLUSH, new Bundle(), token) == TextToSpeech.ERROR) {
            String request = requestId; clear(); emit(request, "error");
        }
    }

    private void clear() {
        requestId = null; token = null; paused = false; requestOwner = "";
        if (engine != null) engine.stop();
    }

    private void resolveVoices(PluginCall call) {
        if (!ready || destroyed) { call.reject("Android speech is unavailable. Check your device's text-to-speech engine and installed voices."); return; }
        JSArray voices = new JSArray();
        if (engine.getVoices() != null) for (Voice voice : engine.getVoices()) {
            if (voice.getFeatures() != null && voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
            JSObject item = new JSObject(); item.put("voiceURI", voice.getName()); item.put("name", voice.getName());
            item.put("lang", voice.getLocale().toLanguageTag()); voices.put(item);
        }
        JSObject result = new JSObject(); result.put("voices", voices); call.resolve(result);
    }

    @PluginMethod public void getVoices(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!ready && !failed && !destroyed) waiting.add(call); else resolveVoices(call);
        });
    }

    @PluginMethod public void speak(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!ready || destroyed) { call.reject("Android speech is unavailable."); return; }
            clear();
            String content = call.getString("text", "");
            String id = call.getString("id", "");
            if (content.isEmpty() || id.isEmpty()) { call.reject("Speech requires text and an identifier."); return; }
            int language = engine.setLanguage(Locale.forLanguageTag(call.getString("lang", "en")));
            String chosen = call.getString("voice", "");
            boolean voiceFound = false;
            if (!chosen.isEmpty() && engine.getVoices() != null) for (Voice voice : engine.getVoices()) {
                if (voice.getName().equals(chosen)) { voiceFound = engine.setVoice(voice) == TextToSpeech.SUCCESS; break; }
            }
            if (!voiceFound && language < TextToSpeech.LANG_AVAILABLE) { call.reject("Install a text-to-speech voice for this language in Android Settings."); return; }
            double rate = call.getDouble("rate", 1.0);
            engine.setSpeechRate((float) Math.max(0.5, Math.min(2.0, rate)));
            requestOwner = call.getString("owner", "");
            requestId = id; text = content; offset = 0; paused = false;
            speakChunk(); call.resolve();
        });
    }

    private boolean owns(PluginCall call) { return requestOwner.equals(call.getString("owner", "")); }

    @PluginMethod public void pause(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (owns(call) && requestId != null) { paused = true; token = null; engine.stop(); } call.resolve(); });
    }
    @PluginMethod public void resume(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (owns(call) && paused && requestId != null) { paused = false; speakChunk(); } call.resolve(); });
    }
    @PluginMethod public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (owns(call)) clear(); call.resolve(); });
    }
    @Override protected void handleOnPause() {
        String previous = requestId; clear(); if (previous != null) emit(previous, "interrupted");
    }
    @Override protected void handleOnDestroy() {
        destroyed = true; clear();
        for (PluginCall call : waiting) call.reject("Speech engine closed.");
        waiting.clear(); if (engine != null) { engine.shutdown(); engine = null; }
    }
}
