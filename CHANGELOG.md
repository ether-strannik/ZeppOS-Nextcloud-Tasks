# Changelog

## [Unreleased]

### Added

#### Nextcloud CalDAV Integration
- **CalDAV Proxy Architecture**: Vercel-hosted proxy to workaround Zepp OS HTTP method limitations (only GET/POST supported, CalDAV requires PROPFIND/REPORT/PUT/DELETE)
- **Multi-status support**:
  - COMPLETED - single tap
  - IN-PROCESS - double tap (yellow progress icon)
  - NEEDS-ACTION - single tap on completed task
- **Priority levels** with colored rings around checkbox:
  - High (1-4): Red ring
  - Medium (5): Yellow ring
  - Low (6-9): Blue ring
  - None (0): White/default
- **Subtasks hierarchy**: RELATED-TO/UID support with indented display
- **Due date countdown**: Optional "8.5h" / "2d" badge display
- **Task descriptions**: DESCRIPTION property support with pencil icon indicator
- **GPS location**: GEO/LOCATION properties with automatic DMS to decimal conversion

#### Enhanced Edit Screen
- Edit task title
- Edit task description/notes
- Edit task priority (0-9)
- Add subtasks (creates RELATED-TO link)
- Add current GPS location
- Clear location

#### Debug System
- File-based debug logger on watch (`log`, `flushLog`, `readLog`, `clearLog`)
- Debug log viewer in Settings screen
- Sync log to phone via Zepp app
- Terminal-style scrollable log display in phone app Debug tab

#### UI Features
- **Reminder countdown**: Optional "8.5h" / "2d" badge for due dates
- **Alphabetical sorting**: Optional A-Z sort in Settings
- **Pull to refresh**: Double swipe down to sync
- **Subtasks display**: Indented rows with toggleable completion

#### Offline System
- **Cached database**: All lists + tasks cached locally
- **Work offline mode**: Manual toggle in Settings
- **Sync on demand**: Pull-to-refresh syncs, then returns to offline mode
- **Offline change queue**: Task changes queued and synced when online
- All CalDAV properties cached (status, priority, description, dueDate, location, geo, subtasks)

#### Settings Toggles
- Show reminder countdown
- Sort alphabetically
- Pull down to refresh
- Work offline
- Show completed tasks

### Changed
- Revised task row display with notes indicator icon
- Settings screen reorganized with Debug section
- Phone app settings: replaced About tab with Debug tab

### Technical
- Added `device:os.geolocation` permission
- GPS sensor returns DMS objects, converted to decimal degrees
- iCalendar line endings fixed (CRLF per RFC 5545)
- js2ics handles numeric values for PRIORITY

---

## [2.4-fork.1] - 2024-12-25

### Changed
- Forked from melianmiko/ZeppOS-Tasks
- Updated README for Nextcloud focus

### Removed
- Google Tasks sync (Nextcloud-only focus)
- Microsoft To Do sync (Nextcloud-only focus)

---

## [2.4] - Original Release
Last version by melianmiko before fork.

---

## Architecture Notes

### CalDAV Proxy Flow
```
Watch ←BLE→ Phone ←HTTPS→ Vercel Proxy ←CalDAV→ Nextcloud
                   POST +                PROPFIND
                   X-HTTP-Method-Override REPORT
                                         PUT
                                         DELETE
```

### VTODO Properties Supported
| Property    | Status | Notes |
|-------------|--------|-------|
| SUMMARY     | ✅ | Task title |
| STATUS      | ✅ | NEEDS-ACTION, IN-PROCESS, COMPLETED |
| PRIORITY    | ✅ | 0-9 with color coding |
| DUE         | ✅ | Countdown display |
| DESCRIPTION | ✅ | Notes with icon indicator |
| RELATED-TO  | ✅ | Subtasks hierarchy |
| GEO         | ✅ | GPS coordinates |
| LOCATION    | ✅ | Location text |
| DTSTART     | ❌ | Not implemented |
| CATEGORIES  | ❌ | Not implemented |
| VALARM      | ❌ | Not implemented |
| RRULE       | ❌ | Not implemented |
