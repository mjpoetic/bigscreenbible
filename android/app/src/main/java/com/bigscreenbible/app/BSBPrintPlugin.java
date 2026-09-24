package com.bigscreenbible.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintJob;
import android.print.PrintManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BSBPrint")
public class BSBPrintPlugin extends Plugin {
    private PrintJob currentJob;

    @PluginMethod
    public void print(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (currentJob != null && !currentJob.isCancelled()
                    && !currentJob.isCompleted() && !currentJob.isFailed()) {
                    call.reject("A print job is already open.");
                    return;
                }
                PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                if (manager == null) {
                    call.reject("Printing is unavailable on this device.");
                    return;
                }
                // Print the loaded app document so its existing @media print rules
                // retain passage selection, translations, and print preferences.
                String jobName = "Big Screen Bible";
                currentJob = manager.print(jobName,
                    getBridge().getWebView().createPrintDocumentAdapter(jobName),
                    new PrintAttributes.Builder().build());
                JSObject result = new JSObject();
                result.put("presented", true);
                call.resolve(result); // Opening the dialog does not mean paper was printed.
            } catch (Exception error) {
                call.reject("Could not open Android printing.", error);
            }
        });
    }
}
