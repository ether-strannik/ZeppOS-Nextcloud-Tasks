import {ConfiguredListScreen} from "../ConfiguredListScreen";
import {ScreenBoard} from "../../lib/mmk/ScreenBoard";
import {DateTimePicker} from "../../lib/mmk/DateTimePicker";
import {createSpinner, request} from "../Utils";

const { t } = getApp()._options.globalData

class AddEventScreen extends ConfiguredListScreen {
  constructor() {
    super();

    // Event data
    this.title = "";
    this.startDate = null;
    this.endDate = null;
    this.location = "";
    this.description = "";

    // Calendar selection
    this.calendars = [];
    this.selectedCalendarId = null;
    this.selectedCalendarTitle = "";
  }

  build() {
    this.headline(t("Add to Calendar"));

    // Load calendars first
    this.loadCalendars();

    // Title
    this.row({
      text: t("Title: ") + (this.title || t("(tap to set)")),
      icon: "icon_s/edit.png",
      callback: () => this.showTitleEditor()
    });

    // Start date/time
    this.row({
      text: t("Start: ") + this.formatDateTime(this.startDate),
      icon: "icon_s/calendar.png",
      callback: () => this.showStartDatePicker()
    });

    // End date/time
    this.row({
      text: t("End: ") + this.formatDateTime(this.endDate),
      icon: "icon_s/calendar.png",
      callback: () => this.showEndDatePicker()
    });

    // Calendar selection
    this.offset(16);
    this.calendarRow = this.row({
      text: t("Calendar: ") + (this.selectedCalendarTitle || t("Loading...")),
      icon: "icon_s/list.png",
      callback: () => this.showCalendarPicker()
    });

    // Save button
    this.offset(16);
    this.row({
      text: t("Save Event"),
      icon: "icon_s/cb_true.png",
      callback: () => this.saveEvent()
    });

    this.offset();

    // Setup ScreenBoard for title
    this.titleBoard = new ScreenBoard();
    this.titleBoard.title = t("Event title");
    this.titleBoard.value = this.title;
    this.titleBoard.confirmButtonText = t("OK");
    this.titleBoard.onConfirm = (v) => {
      this.title = v;
      this.rebuild();
    };
    this.titleBoard.visible = false;
  }

  loadCalendars() {
    request({
      package: "caldav_proxy",
      action: "get_event_calendars"
    }, 10000).then((calendars) => {
      if (Array.isArray(calendars) && calendars.length > 0) {
        this.calendars = calendars;
        // Select first calendar by default
        this.selectedCalendarId = calendars[0].id;
        this.selectedCalendarTitle = calendars[0].title;
        // Update UI
        if (this.calendarRow) {
          this.calendarRow.textView.setProperty(hmUI.prop.TEXT,
            t("Calendar: ") + this.selectedCalendarTitle);
        }
      } else {
        this.selectedCalendarTitle = t("No calendars found");
        if (this.calendarRow) {
          this.calendarRow.textView.setProperty(hmUI.prop.TEXT,
            t("Calendar: ") + this.selectedCalendarTitle);
        }
      }
    }).catch((e) => {
      console.log("Failed to load calendars:", e);
      this.selectedCalendarTitle = t("Error loading");
    });
  }

  rebuild() {
    hmUI.setLayerScrolling(true);
    hmApp.reloadPage({
      url: "page/amazfit/AddEventScreen",
      param: JSON.stringify({
        title: this.title,
        startDate: this.startDate ? this.startDate.getTime() : null,
        endDate: this.endDate ? this.endDate.getTime() : null,
        selectedCalendarId: this.selectedCalendarId,
        selectedCalendarTitle: this.selectedCalendarTitle
      })
    });
  }

  formatDateTime(date) {
    if (!date) return t("(tap to set)");
    const d = date;
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  formatDateTimeForCalDAV(date) {
    if (!date) return null;
    const d = date;
    return d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, "0") +
      d.getDate().toString().padStart(2, "0") + "T" +
      d.getHours().toString().padStart(2, "0") +
      d.getMinutes().toString().padStart(2, "0") +
      d.getSeconds().toString().padStart(2, "0");
  }

  showTitleEditor() {
    this.titleBoard.visible = true;
    hmApp.setLayerY(0);
    hmUI.setLayerScrolling(false);
  }

  showStartDatePicker() {
    hmUI.setLayerScrolling(false);
    hmApp.setLayerY(0);

    this.dateTimePicker = new DateTimePicker({
      initialDate: this.startDate || new Date(),
      showTime: true,
      onConfirm: (date) => {
        this.dateTimePicker = null;
        this.startDate = date;
        // If end date not set or before start, set end = start + 1 hour
        if (!this.endDate || this.endDate <= date) {
          this.endDate = new Date(date.getTime() + 60 * 60 * 1000);
        }
        this.rebuild();
      },
      onCancel: () => {
        this.dateTimePicker = null;
        hmUI.setLayerScrolling(true);
      }
    });
    this.dateTimePicker.start();
  }

  showEndDatePicker() {
    hmUI.setLayerScrolling(false);
    hmApp.setLayerY(0);

    this.dateTimePicker = new DateTimePicker({
      initialDate: this.endDate || this.startDate || new Date(),
      showTime: true,
      onConfirm: (date) => {
        this.dateTimePicker = null;
        // Validate: end must be after start
        if (this.startDate && date <= this.startDate) {
          hmUI.showToast({ text: t("End must be after start") });
          hmUI.setLayerScrolling(true);
          return;
        }
        this.endDate = date;
        this.rebuild();
      },
      onCancel: () => {
        this.dateTimePicker = null;
        hmUI.setLayerScrolling(true);
      }
    });
    this.dateTimePicker.start();
  }

  showCalendarPicker() {
    if (this.calendars.length === 0) {
      hmUI.showToast({ text: t("No calendars available") });
      return;
    }

    // For now, cycle through calendars on tap
    const currentIndex = this.calendars.findIndex(c => c.id === this.selectedCalendarId);
    const nextIndex = (currentIndex + 1) % this.calendars.length;
    this.selectedCalendarId = this.calendars[nextIndex].id;
    this.selectedCalendarTitle = this.calendars[nextIndex].title;

    if (this.calendarRow) {
      this.calendarRow.textView.setProperty(hmUI.prop.TEXT,
        t("Calendar: ") + this.selectedCalendarTitle);
    }
  }

  saveEvent() {
    // Validate
    if (!this.title || !this.title.trim()) {
      hmUI.showToast({ text: t("Title required") });
      return;
    }
    if (!this.startDate) {
      hmUI.showToast({ text: t("Start date required") });
      return;
    }
    if (!this.selectedCalendarId) {
      hmUI.showToast({ text: t("Select a calendar") });
      return;
    }

    const hideSpinner = createSpinner();

    const event = {
      title: this.title.trim(),
      dtstart: this.formatDateTimeForCalDAV(this.startDate),
      dtend: this.endDate ? this.formatDateTimeForCalDAV(this.endDate) : null,
      location: this.location || null,
      description: this.description || null
    };

    request({
      package: "caldav_proxy",
      action: "insert_event",
      calendarId: this.selectedCalendarId,
      event: event
    }, 10000).then((resp) => {
      hideSpinner();
      if (resp && resp.error) {
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmUI.showToast({ text: t("Event created") });
      hmApp.goBack();
    }).catch((e) => {
      hideSpinner();
      hmUI.showToast({ text: e.message || t("Failed to save") });
    });
  }
}

Page({
  onInit(param) {
    hmUI.setStatusBarVisible(true);
    hmUI.updateStatusBarTitle(t("Add to Calendar"));

    const screen = new AddEventScreen();

    // Restore state if passed
    if (param) {
      try {
        const state = JSON.parse(param);
        screen.title = state.title || "";
        screen.startDate = state.startDate ? new Date(state.startDate) : null;
        screen.endDate = state.endDate ? new Date(state.endDate) : null;
        screen.location = state.location || "";
        screen.description = state.description || "";
        screen.selectedCalendarId = state.selectedCalendarId || null;
        screen.selectedCalendarTitle = state.selectedCalendarTitle || "";
      } catch(e) {}
    }

    screen.build();
  }
})
