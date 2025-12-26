import {ListScreen} from "../../lib/mmk/ListScreen";
import {ScreenBoard} from "../../lib/mmk/ScreenBoard";
import {DateTimePicker} from "../../lib/mmk/DateTimePicker";
import {createSpinner, log, flushLog} from "../Utils";

const { t, tasksProvider } = getApp()._options.globalData

class TaskEditScreen extends ListScreen {
  constructor(param) {
    super();
    this.isSaving = false;

    param = JSON.parse(param);
    this.task = tasksProvider.getTaskList(param.list_id).getTask(param.task_id);
  }

  init() {
    const hideSpinner = createSpinner();
    this.task.sync().then(() => {
      hideSpinner();
      this.build();
    }).catch((e) => {
      console.log("Sync error:", e);
      hideSpinner();
      this.build();
    });
  }

  build() {
    // Title section
    this.headline(t("Title"));
    this.row({
      text: this.task.title || t("(no title)"),
      icon: "icon_s/edit.png",
      callback: () => this.showTitleEditor()
    });

    // Notes/Description section
    this.offset(16);
    this.headline(t("Notes"));
    const hasNotes = this.task.description && this.task.description.trim().length > 0;
    if (hasNotes) {
      // Show notes content (truncated if long)
      const notesPreview = this.task.description.length > 100
        ? this.task.description.substring(0, 100) + "..."
        : this.task.description;
      this.text({
        text: notesPreview,
        fontSize: this.fontSize - 2,
        color: 0xAAAAAA
      });
    }
    this.row({
      text: hasNotes ? t("Edit notes") : t("Add notes"),
      icon: "icon_s/edit.png",
      callback: () => this.showNotesEditor()
    });

    // Priority section (CalDAV only - tasks with setPriority)
    if (typeof this.task.setPriority === 'function') {
      this.offset(16);
      this.headline(t("Priority"));
      const priorityLabel = this.getPriorityLabel(this.task.priority);
      this.row({
        text: `${priorityLabel} (${this.task.priority})`,
        icon: "icon_s/edit.png",
        callback: () => this.showPriorityEditor()
      });
    }

    // Due Date section (CalDAV only - tasks with setDueDate)
    if (typeof this.task.setDueDate === 'function') {
      this.offset(16);
      this.headline(t("Due Date"));
      const dueDateText = this.task.dueDate
        ? this.formatDateTime(this.task.dueDate)
        : t("Not set");
      this.dueDateRow = this.row({
        text: dueDateText,
        icon: "icon_s/edit.png",
        callback: () => this.showDueDatePicker()
      });
      if (this.task.dueDate) {
        this.row({
          text: t("Clear due date"),
          icon: "icon_s/delete.png",
          callback: () => this.clearDueDate()
        });
      }
    }

    // Location section (CalDAV only - tasks with setLocation)
    if (typeof this.task.setLocation === 'function') {
      this.offset(16);
      this.headline(t("Location"));
      if (this.task.geo) {
        this.text({
          text: `${this.task.geo.lat.toFixed(6)}, ${this.task.geo.lon.toFixed(6)}`,
          fontSize: this.fontSize - 2,
          color: 0xAAAAAA
        });
        if (this.task.location) {
          this.text({
            text: this.task.location,
            fontSize: this.fontSize - 2,
            color: 0xAAAAAA
          });
        }
      }
      this.locationRow = this.row({
        text: this.task.geo ? t("Update location") : t("Add current location"),
        icon: "icon_s/edit.png",
        callback: () => this.captureGPSLocation()
      });
      if (this.task.geo) {
        this.row({
          text: t("Clear location"),
          icon: "icon_s/delete.png",
          callback: () => this.clearLocation()
        });
      }
    }

    // Add subtask button (CalDAV only - tasks with uid)
    if (this.task.uid) {
      this.offset(16);
      this.headline(t("Subtasks"));
      this.row({
        text: t("Add subtask"),
        icon: "icon_s/add.png",
        callback: () => this.showSubtaskEditor()
      });
    }

    // Delete action
    this.offset(16);
    this.deleteRow = this.row({
      text: t("Delete"),
      icon: "icon_s/delete.png",
      callback: () => this.doDelete()
    });
    this.offset();

    // Setup keyboard for title editing
    this.titleBoard = new ScreenBoard();
    this.titleBoard.title = t("Edit title");
    this.titleBoard.value = this.task.title;
    this.titleBoard.confirmButtonText = t("Save");
    this.titleBoard.onConfirm = (v) => this.doOverrideTitle(v);
    this.titleBoard.visible = false;

    // Setup keyboard for notes editing
    this.notesBoard = new ScreenBoard();
    this.notesBoard.title = t("Edit notes");
    this.notesBoard.value = this.task.description || "";
    this.notesBoard.confirmButtonText = t("Save");
    this.notesBoard.onConfirm = (v) => this.doOverrideNotes(v);
    this.notesBoard.visible = false;

    // Setup keyboard for subtask creation (CalDAV only)
    if (this.task.uid) {
      this.subtaskBoard = new ScreenBoard();
      this.subtaskBoard.title = t("New subtask");
      this.subtaskBoard.value = "";
      this.subtaskBoard.confirmButtonText = t("Create");
      this.subtaskBoard.onConfirm = (v) => this.doCreateSubtask(v);
      this.subtaskBoard.visible = false;
    }

    // Setup keyboard for priority editing (CalDAV only)
    if (typeof this.task.setPriority === 'function') {
      this.priorityBoard = new ScreenBoard();
      this.priorityBoard.title = t("Priority (0-9)");
      this.priorityBoard.value = this.task.priority.toString();
      this.priorityBoard.confirmButtonText = t("Save");
      this.priorityBoard.onConfirm = (v) => this.doOverridePriority(v);
      this.priorityBoard.visible = false;
    }
  }

  /**
   * Get human-readable priority label
   */
  getPriorityLabel(priority) {
    if (priority >= 1 && priority <= 4) return t("High");
    if (priority === 5) return t("Medium");
    if (priority >= 6 && priority <= 9) return t("Low");
    return t("None");
  }

  /**
   * Format date/time for display
   */
  formatDateTime(date) {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }

  showDueDatePicker() {
    // Hide main list
    hmUI.setLayerScrolling(false);
    hmApp.setLayerY(0);

    this.dateTimePicker = new DateTimePicker({
      initialDate: this.task.dueDate || new Date(),
      showTime: true,
      onConfirm: (date) => {
        this.dateTimePicker = null;
        hmUI.setLayerScrolling(true);
        this.saveDueDate(date);
      },
      onCancel: () => {
        this.dateTimePicker = null;
        hmUI.setLayerScrolling(true);
      }
    });
    this.dateTimePicker.start();
  }

  saveDueDate(date) {
    if (this.isSaving) return;

    this.isSaving = true;
    this.dueDateRow.setText(t("Saving…"));
    createSpinner();

    this.task.setDueDate(date).then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        this.dueDateRow.setText(this.formatDateTime(date));
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      this.dueDateRow.setText(this.task.dueDate ? this.formatDateTime(this.task.dueDate) : t("Not set"));
      hmUI.showToast({ text: e.message || t("Failed to save") });
    });
  }

  clearDueDate() {
    if (this.isSaving) return;

    this.isSaving = true;
    createSpinner();

    this.task.setDueDate(null).then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      hmUI.showToast({ text: e.message || t("Failed to clear") });
    });
  }

  showTitleEditor() {
    this.titleBoard.visible = true;
    hmApp.setLayerY(0);
    hmUI.setLayerScrolling(false);
  }

  showNotesEditor() {
    this.notesBoard.visible = true;
    hmApp.setLayerY(0);
    hmUI.setLayerScrolling(false);
  }

  showSubtaskEditor() {
    this.subtaskBoard.visible = true;
    hmApp.setLayerY(0);
    hmUI.setLayerScrolling(false);
  }

  showPriorityEditor() {
    this.priorityBoard.visible = true;
    hmApp.setLayerY(0);
    hmUI.setLayerScrolling(false);
  }

  doDelete() {
    if(this.isSaving) return;

    this.isSaving = true;
    this.deleteRow.setText(t("Deleting…"));

    createSpinner();
    this.task.delete().then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        this.deleteRow.setText(t("Delete"));
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      this.deleteRow.setText(t("Delete"));
      hmUI.showToast({ text: e.message || t("Failed to delete") });
    });
  }

  doOverrideTitle(value) {
    if(this.isSaving) return;

    this.isSaving = true;
    this.titleBoard.confirmButtonText = t("Saving, wait…");
    this.task.setTitle(value).then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        this.titleBoard.confirmButtonText = t("Save");
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      this.titleBoard.confirmButtonText = t("Save");
      hmUI.showToast({ text: e.message || t("Failed to save") });
    });
  }

  doOverrideNotes(value) {
    if(this.isSaving) return;

    // Check if task supports notes
    if (typeof this.task.setDescription !== 'function') {
      hmUI.showToast({ text: t("Notes not supported") });
      return;
    }

    this.isSaving = true;
    this.notesBoard.confirmButtonText = t("Saving, wait…");
    this.task.setDescription(value).then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        this.notesBoard.confirmButtonText = t("Save");
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      this.notesBoard.confirmButtonText = t("Save");
      hmUI.showToast({ text: e.message || t("Failed to save") });
    });
  }

  doCreateSubtask(title) {
    if(this.isSaving) return;
    if(!title || !title.trim()) {
      hmUI.showToast({ text: t("Title required") });
      return;
    }

    this.isSaving = true;
    this.subtaskBoard.confirmButtonText = t("Creating…");

    // Insert subtask with parent UID
    this.task.list.insertSubtask(title.trim(), this.task.uid).then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        this.subtaskBoard.confirmButtonText = t("Create");
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      this.subtaskBoard.confirmButtonText = t("Create");
      hmUI.showToast({ text: e.message || t("Failed to create") });
    });
  }

  doOverridePriority(value) {
    if(this.isSaving) return;

    // Parse and validate priority
    const priority = parseInt(value, 10);
    if (isNaN(priority) || priority < 0 || priority > 9) {
      hmUI.showToast({ text: t("Enter 0-9") });
      return;
    }

    this.isSaving = true;
    this.priorityBoard.confirmButtonText = t("Saving…");

    this.task.setPriority(priority).then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        this.priorityBoard.confirmButtonText = t("Save");
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      this.priorityBoard.confirmButtonText = t("Save");
      hmUI.showToast({ text: e.message || t("Failed to save") });
    });
  }

  captureGPSLocation() {
    if(this.isSaving) return;

    this.isSaving = true;
    this.locationRow.setText(t("Getting GPS…"));

    // Try hmSensor API (available on most devices)
    let geolocation = null;

    log("=== GPS Capture Start ===");

    try {
      if (typeof hmSensor !== 'undefined' && hmSensor.id) {
        // Check available sensor IDs
        const sensorIds = Object.keys(hmSensor.id);
        log("Available sensors:", sensorIds.join(', '));

        // Try GEOLOCATION first
        if (hmSensor.id.GEOLOCATION !== undefined) {
          log("GEOLOCATION id:", hmSensor.id.GEOLOCATION);
          geolocation = hmSensor.createSensor(hmSensor.id.GEOLOCATION);
          log("Created GEOLOCATION sensor");
        }
        // Some devices might use GPS instead
        else if (hmSensor.id.GPS !== undefined) {
          log("GPS id:", hmSensor.id.GPS);
          geolocation = hmSensor.createSensor(hmSensor.id.GPS);
          log("Created GPS sensor");
        } else {
          log("No GEOLOCATION or GPS in sensor IDs");
        }
      } else {
        log("hmSensor not available");
      }
    } catch(e) {
      log("Sensor creation error:", e.message || e);
    }
    flushLog();

    if (!geolocation) {
      this.isSaving = false;
      this.locationRow.setText(this.task.geo ? t("Update location") : t("Add current location"));
      hmUI.showToast({ text: t("GPS not available") });
      return;
    }

    let timeoutId = null;
    let acquired = false;

    const onGPSData = () => {
      if (acquired) return;

      // Log sensor object properties for debugging
      log("Sensor props:", Object.keys(geolocation).join(', '));

      // Try different property names that different API versions might use
      let lat = geolocation.latitude;
      let lon = geolocation.longitude;

      // Log raw values and their types
      log("Raw lat type:", typeof lat, "value:", JSON.stringify(lat));
      log("Raw lon type:", typeof lon, "value:", JSON.stringify(lon));

      // Convert DMS (Degrees, Minutes, Seconds) to decimal degrees
      function dmsToDecimal(dms) {
        if (!dms || typeof dms !== 'object') return dms;
        if (dms.degrees === undefined) return dms;

        let decimal = Math.abs(dms.degrees) + (dms.minutes || 0) / 60 + (dms.seconds || 0) / 3600;

        // Handle direction: S and W are negative
        if (dms.direction === 'S' || dms.direction === 'W') {
          decimal = -decimal;
        }
        return decimal;
      }

      // If lat/lon are objects (DMS format), convert to decimal
      if (lat && typeof lat === 'object') {
        lat = dmsToDecimal(lat);
        log("Converted lat:", lat);
      }
      if (lon && typeof lon === 'object') {
        lon = dmsToDecimal(lon);
        log("Converted lon:", lon);
      }

      // Some APIs might use getLatitude/getLongitude methods
      if ((lat === undefined || lat === null || typeof lat === 'object') && typeof geolocation.getLatitude === 'function') {
        lat = geolocation.getLatitude();
        lon = geolocation.getLongitude();
        log("From methods: lat=", lat, "lon=", lon);
      }

      log("Final GPS data: lat=" + lat + " lon=" + lon);
      flushLog();

      // Check if we have valid coordinates
      if (lat !== undefined && lon !== undefined && lat !== null && lon !== null && (lat !== 0 || lon !== 0)) {
        acquired = true;
        if (timeoutId) clearTimeout(timeoutId);

        try {
          geolocation.stop();
        } catch(e) {
          console.log("Error stopping GPS:", e);
        }

        console.log("GPS acquired:", lat, lon);
        this.saveLocation(lat, lon);
      }
    };

    try {
      // Start GPS
      geolocation.start();

      // Register callback - try different event names
      if (typeof geolocation.onChange === 'function') {
        geolocation.onChange(onGPSData);
      } else if ('onGPS' in geolocation) {
        geolocation.onGPS = onGPSData;
      }

      // Check immediately in case data is already available
      setTimeout(() => onGPSData(), 500);

      // Timeout after 30 seconds
      timeoutId = setTimeout(() => {
        if (!acquired) {
          try {
            geolocation.stop();
          } catch(e) {}
          this.isSaving = false;
          this.locationRow.setText(this.task.geo ? t("Update location") : t("Add current location"));
          hmUI.showToast({ text: t("GPS timeout") });
        }
      }, 30000);

    } catch(e) {
      console.log("GPS start error:", e);
      this.isSaving = false;
      this.locationRow.setText(this.task.geo ? t("Update location") : t("Add current location"));
      hmUI.showToast({ text: t("GPS error: ") + e.message });
    }
  }

  saveLocation(lat, lon) {
    this.locationRow.setText(t("Saving…"));

    this.task.setLocation(lat, lon).then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        this.locationRow.setText(this.task.geo ? t("Update location") : t("Add current location"));
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      this.locationRow.setText(this.task.geo ? t("Update location") : t("Add current location"));
      hmUI.showToast({ text: e.message || t("Failed to save") });
    });
  }

  clearLocation() {
    if(this.isSaving) return;

    this.isSaving = true;
    createSpinner();

    this.task.setLocation(null, null, "").then((resp) => {
      if (resp && resp.error) {
        this.isSaving = false;
        hmUI.showToast({ text: resp.error });
        return;
      }
      hmApp.goBack();
    }).catch((e) => {
      this.isSaving = false;
      hmUI.showToast({ text: e.message || t("Failed to clear") });
    });
  }
}

// noinspection JSCheckFunctionSignatures
Page({
  onInit(params) {
    hmUI.setStatusBarVisible(true);
    hmUI.updateStatusBarTitle("");

    hmApp.setScreenKeep(true);
    hmSetting.setBrightScreen(15);

    try {
      new TaskEditScreen(params).init();
    } catch(e) {
      console.log(e);
    }
  },

  onDestroy() {
    hmApp.setScreenKeep(false);
    hmSetting.setBrightScreenCancel();
  }
})
