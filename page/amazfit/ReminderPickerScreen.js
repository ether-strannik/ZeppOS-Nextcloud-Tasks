import { ConfiguredListScreen } from "../ConfiguredListScreen";

const { config, t } = getApp()._options.globalData

// Reminder presets in minutes
const REMINDER_PRESETS = [
  { minutes: 0, label: "At the start" },
  { minutes: 5, label: "5 minutes before" },
  { minutes: 10, label: "10 minutes before" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 30, label: "30 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 120, label: "2 hours before" },
  { minutes: 1440, label: "1 day before" },
  { minutes: 2880, label: "2 days before" },
];

class ReminderPickerScreen extends ConfiguredListScreen {
  constructor(params) {
    super();

    params = JSON.parse(params);
    this.listId = params.listId;
    this.taskId = params.taskId;
    this.currentAlarm = params.currentAlarm;
  }

  build() {
    this.headline(t("Set reminder:"));

    REMINDER_PRESETS.forEach(({ minutes, label }) => {
      const isSelected = this.currentAlarm === minutes;
      this.row({
        text: t(label),
        icon: isSelected ? "icon_s/cb_true.png" : "icon_s/cb_false.png",
        color: isSelected ? 0x44FF44 : 0xFFFFFF,
        callback: () => this.selectReminder(minutes)
      });
    });

    this.offset();
  }

  selectReminder(minutes) {
    // Store selection and go back - TaskEditScreen will read it
    config.set("_selectedReminder", { listId: this.listId, taskId: this.taskId, minutes });
    hmApp.goBack();
  }
}

Page({
  onInit(params) {
    hmUI.setStatusBarVisible(true);
    hmUI.updateStatusBarTitle("");

    new ReminderPickerScreen(params).build();
  }
})
