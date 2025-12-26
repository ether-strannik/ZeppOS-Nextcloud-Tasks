export class CachedTask {
    constructor(data, config, withLog) {
        this.id = data.id;
        this.title = data.title;
        this.completed = data.completed;
        this.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        this.location = data.location || "";
        this.geo = data.geo || null;
        this.categories = data.categories || [];
        this.alarm = data.alarm !== undefined ? data.alarm : null;

        this.config = config;
        this.withLog = withLog;
    }

    /**
     * Get time until due date (e.g., "3.5h", "2d", "-1d" for overdue)
     * Returns null if no due date
     */
    getReminderCountdown() {
        if (!this.dueDate) return null;

        const diff = this.dueDate.getTime() - Date.now();
        const hours = diff / (1000 * 60 * 60);

        if (Math.abs(hours) < 24) {
            const h = hours.toFixed(1);
            return `${h}h`;
        } else {
            const days = Math.round(hours / 24);
            return `${days}d`;
        }
    }

    _getSelfIndex(tasks) {
        for(const i in tasks) {
            if(tasks[i].id === this.id)
                return i;
        }
        return null;
    }

    sync() {
        return Promise.resolve();
    }

    setCompleted(value) {
        const tasks = this.config.get("tasks");
        const log = this.config.get("log", []);

        const i = this._getSelfIndex(tasks);
        tasks[i].completed = value;

        if(this.withLog) 
            log.push({command: "set_completed", id: this.id, value});

        this.config.update({tasks, log});
        this.completed = value;
        return Promise.resolve();
    }

    setTitle(value) {
        const tasks = this.config.get("tasks");
        const log = this.config.get("log", []);

        const i = this._getSelfIndex(tasks);
        tasks[i].title = value;

        if(this.withLog) 
            log.push({command: "set_title", id: this.id, value});

        this.config.update({tasks, log});
        this.title = value;
        return Promise.resolve();
    }

    setCategories(value) {
        const tasks = this.config.get("tasks");
        const log = this.config.get("log", []);

        const i = this._getSelfIndex(tasks);
        tasks[i].categories = value || [];

        if(this.withLog)
            log.push({command: "set_categories", id: this.id, value});

        this.config.update({tasks, log});
        this.categories = value || [];
        return Promise.resolve();
    }

    setAlarm(value) {
        const tasks = this.config.get("tasks");
        const log = this.config.get("log", []);

        const i = this._getSelfIndex(tasks);
        tasks[i].alarm = value;

        if(this.withLog)
            log.push({command: "set_alarm", id: this.id, value});

        this.config.update({tasks, log});
        this.alarm = value;
        return Promise.resolve();
    }

    /**
     * Format alarm minutes to human-readable string
     */
    formatAlarm() {
        if (this.alarm === null) return null;
        if (this.alarm === 0) return "At time";
        if (this.alarm < 60) return this.alarm + " min";
        if (this.alarm < 24 * 60) {
            const hours = this.alarm / 60;
            return hours === 1 ? "1 hour" : hours + " hours";
        }
        const days = this.alarm / (24 * 60);
        return days === 1 ? "1 day" : days + " days";
    }

    delete() {
        const log = this.config.get("log", []);
        let tasks = this.config.get("tasks");

        tasks = tasks.filter((item) => item.id !== this.id);

        if(this.withLog)
            log.push({command: "delete", id: this.id});

        this.config.update({tasks, log});
        return Promise.resolve();
    }
}
