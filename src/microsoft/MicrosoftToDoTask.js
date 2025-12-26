/**
 * @implements TaskInterface
 */
export class MicrosoftToDoTask {
  constructor(data, parent, handler) {
    this.id = data.id;
    this.title = data.title;
    this.completed = data.status === "completed";
    this.important = data.importance === "high";
    this._parseReminder(data);

    this.list = parent;
    this._handler = handler;
  }

  _parseReminder(data) {
    this.isReminderOn = data.isReminderOn || false;
    this.reminderDateTime = null;

    if (data.reminderDateTime && data.reminderDateTime.dateTime) {
      // Microsoft stores datetime in UTC
      this.reminderDateTime = new Date(data.reminderDateTime.dateTime + "Z");
    }
  }

  /**
   * Get time until reminder in hours (e.g., "3.5h" or "2d")
   * Returns null if no reminder or reminder is past
   */
  getReminderCountdown() {
    if (!this.isReminderOn || !this.reminderDateTime) return null;

    const diff = this.reminderDateTime.getTime() - Date.now();

    if (diff <= 0) return null;

    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = Math.round(hours / 24);
      return `${days}d`;
    }
  }

  sync() {
    return this._handler.request({
      method: "GET",
      url: `/lists/${this.list.id}/tasks/${this.id}`,
    }).then((data) => {
      this.title = data.title;
      this.completed = data.status === "completed";
      this.important = data.importance === "high";
      this._parseReminder(data);
    });
  }

  delete() {
    return this._handler.request({
      method: "DELETE",
      url: `/lists/${this.list.id}/tasks/${this.id}`
    });
  }

  setCompleted(completed) {
    return this._handler.request({
      method: "PATCH",
      url: `/lists/${this.list.id}/tasks/${this.id}`,
      body: {
        status: completed ? "completed": "notStarted",
      }
    });
  }

  setTitle(title) {
    return this._handler.request({
      method: "PATCH",
      url: `/lists/${this.list.id}/tasks/${this.id}`,
      body: {
        title
      }
    });
  }

  setImportant(important) {
    this.important = important;
    return this._handler.request({
      method: "PATCH",
      url: `/lists/${this.list.id}/tasks/${this.id}`,
      body: {
        importance: important ? "high" : "normal"
      }
    });
  }

  /**
   * Get subtasks (checklist items) for this task
   * Returns array of {id, displayName, isChecked}
   */
  getChecklistItems() {
    return this._handler.request({
      method: "GET",
      url: `/lists/${this.list.id}/tasks/${this.id}/checklistItems`
    }).then((data) => {
      return data.value || [];
    });
  }

  /**
   * Toggle a checklist item's completed state
   */
  setChecklistItemChecked(itemId, isChecked) {
    return this._handler.request({
      method: "PATCH",
      url: `/lists/${this.list.id}/tasks/${this.id}/checklistItems/${itemId}`,
      body: { isChecked }
    });
  }
}