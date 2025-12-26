import {TextRoot} from "../../lib/mmk/setting/Layout";
import {Paragraph, Title} from "../../lib/mmk/setting/Typography";

export function DebugTab(ctx) {
  // Get debug log from watch
  let debugLogContent = "(No log synced yet. Use 'Sync log to phone' on watch)";
  let timestamp = "";
  try {
    const logData = ctx.settingsStorage.getItem("debug_log");
    if (logData) {
      const parsed = JSON.parse(logData);
      timestamp = parsed.timestamp;
      debugLogContent = parsed.content;
    }
  } catch(e) {
    debugLogContent = "Error parsing log: " + e;
  }

  // Split log into lines for better display
  const logLines = debugLogContent.split('\n');

  return TextRoot([
    Toggle({
      label: "Prevent accessing internet (force cached/offline mode)",
      settingsKey: "force_offline"
    }),
    Paragraph([
      `Device: ${ctx.settingsStorage.getItem("device_name")}`
    ]),
    Title("Watch Debug Log"),
    timestamp ? Paragraph([`Synced: ${timestamp}`], { fontSize: "0.75rem", color: "#888" }) : null,
    View({
      style: {
        backgroundColor: "#1a1a1a",
        padding: "12px",
        borderRadius: "8px",
        marginTop: "8px",
        marginBottom: "16px",
        maxHeight: "400px",
        overflow: "auto"
      }
    }, logLines.map(line =>
      Text({
        style: {
          display: "block",
          fontFamily: "monospace",
          fontSize: "11px",
          lineHeight: "1.4",
          color: "#00ff00",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap"
        }
      }, line || " ")
    )),
  ]);
}
