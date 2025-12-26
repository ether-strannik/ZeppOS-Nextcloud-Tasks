import {TextRoot} from "../../lib/mmk/setting/Layout";
import {Paragraph, Title} from "../../lib/mmk/setting/Typography";

export function DebugTab(ctx) {
  // Get debug log from watch
  let watchLogContent = "(No log synced yet. Use 'Sync log to phone' on watch)";
  let watchTimestamp = "";
  try {
    const logData = ctx.settingsStorage.getItem("debug_log");
    if (logData) {
      const parsed = JSON.parse(logData);
      watchTimestamp = parsed.timestamp;
      watchLogContent = parsed.content;
    }
  } catch(e) {
    watchLogContent = "Error parsing log: " + e;
  }

  // Get phone-side debug log
  let phoneLogContent = "(No phone logs yet)";
  let phoneTimestamp = "";
  try {
    const phoneData = ctx.settingsStorage.getItem("phone_debug_log");
    if (phoneData) {
      const parsed = JSON.parse(phoneData);
      phoneTimestamp = parsed.timestamp;
      phoneLogContent = parsed.content;
    }
  } catch(e) {
    phoneLogContent = "Error parsing log: " + e;
  }

  const watchLogLines = watchLogContent.split('\n');
  const phoneLogLines = phoneLogContent.split('\n');

  const logStyle = {
    backgroundColor: "#1a1a1a",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "8px",
    marginBottom: "16px",
    maxHeight: "300px",
    overflow: "auto"
  };

  const lineStyle = {
    display: "block",
    fontFamily: "monospace",
    fontSize: "11px",
    lineHeight: "1.4",
    color: "#00ff00",
    wordBreak: "break-all",
    whiteSpace: "pre-wrap"
  };

  return TextRoot([
    Toggle({
      label: "Prevent accessing internet (force cached/offline mode)",
      settingsKey: "force_offline"
    }),
    Paragraph([
      `Device: ${ctx.settingsStorage.getItem("device_name")}`
    ]),

    Title("Phone Debug Log (CalDAV)"),
    phoneTimestamp ? Paragraph([`Updated: ${phoneTimestamp}`], { fontSize: "0.75rem", color: "#888" }) : null,
    View({ style: logStyle }, phoneLogLines.map(line =>
      Text({ style: {...lineStyle, color: "#00aaff"} }, line || " ")
    )),

    Title("Watch Debug Log"),
    watchTimestamp ? Paragraph([`Synced: ${watchTimestamp}`], { fontSize: "0.75rem", color: "#888" }) : null,
    View({ style: logStyle }, watchLogLines.map(line =>
      Text({ style: lineStyle }, line || " ")
    )),
  ]);
}
