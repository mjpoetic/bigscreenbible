import { open, showToast, Toast } from "@raycast/api";

export default async function Command() {
  try {
    await open("https://bigscreenbible.com/");
  } catch (error) {
    await showToast({ style: Toast.Style.Failure, title: "Could not open Big Screen Bible", message: String(error) });
  }
}
