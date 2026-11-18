import { Action, ActionPanel, Clipboard, Form, Toast, getPreferenceValues, open, showToast } from "@raycast/api";
import { useState } from "react";
import { passageUrl } from "./passage.mjs";

type Values = { reference: string; translation: string; mode: string };

export default function Command() {
  const preferences = getPreferenceValues<{ translation?: string }>();
  const [error, setError] = useState<string>();

  async function submit(values: Values, copy = false) {
    try {
      const url = passageUrl(values.reference, values.translation, values.mode);
      if (copy) {
        await Clipboard.copy(url);
        await showToast({ style: Toast.Style.Success, title: "Passage link copied" });
      } else {
        await open(url);
      }
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "Could not open passage", message: String(error instanceof Error ? error.message : error) });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Open Passage" onSubmit={(values: Values) => submit(values)} />
          <Action.SubmitForm title="Copy Passage Link" shortcut={{ modifiers: ["cmd", "shift"], key: "c" }} onSubmit={(values: Values) => submit(values, true)} />
        </ActionPanel>
      }
    >
      <Form.TextField id="reference" title="Passage" placeholder="John 3:16–18" error={error} onChange={() => setError(undefined)} onBlur={(event) => setError(event.target.value?.trim() ? undefined : "Enter a Bible reference.")} info="Enter a book and chapter, a verse, or a verse range. Big Screen Bible resolves the reference when it opens." />
      <Form.TextField id="translation" title="Translation" defaultValue={preferences.translation || "BSB"} placeholder="BSB" />
      <Form.Dropdown id="mode" title="Display Mode" defaultValue="reader" storeValue>
        <Form.Dropdown.Item value="reader" title="Reader" />
        <Form.Dropdown.Item value="big" title="Big Screen" />
        <Form.Dropdown.Item value="parallel" title="Parallel Study" />
      </Form.Dropdown>
      <Form.Description text="Opens bigscreenbible.com in your default browser. Scripture and translation availability are handled by Big Screen Bible." />
    </Form>
  );
}
