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
- **Edit start date** with visual calendar and numeric keypad time picker
- **Edit due date** with visual calendar and numeric keypad time picker
- **Date validation**: Prevents setting start date after due date (and vice versa)
- Add subtasks (creates RELATED-TO link)
- Add current GPS location
- Clear location

#### Date/Time Picker Components
- **CalendarPicker**: Visual calendar grid with month navigation, today highlight, weekend colors
- **TimePicker**: Numeric keypad style time input (like Android time picker)
- **DateTimePicker**: Combined date→time selection flow

#### Debug System
- File-based debug logger on watch (`log`, `flushLog`, `readLog`, `clearLog`)
- **Phone-side CalDAV logging**: Request/response logging for debugging server issues
- **Separate debug tabs**: Debug P (phone logs) and Debug W (watch logs)
- Sync watch log to phone via Zepp app
- Terminal-style scrollable log display with full-screen viewing area

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

#### Multi-User Proxy
- **Shared proxy server**: One Vercel deployment works for all users
- **X-Target-Host header**: User's Nextcloud URL passed dynamically
- **Configurable proxy URL**: Advanced users can host their own proxy

### Fixed
- **Login save button**: Fixed "Save configuration" not working after credential validation

### Changed
- Revised task row display with notes indicator icon
- Settings screen reorganized with Debug section
- Phone app settings: replaced About tab with Debug tab
- **Settings order**: Task lists now first, About moved to bottom

### Removed
- **Microsoft To Do support**: Removed MicrosoftHandler, MicrosoftAuth, and related UI
- **Google Tasks support**: Removed GoogleHandler, GoogleAuth, and related UI
- **TickTick support**: Removed TickTickHandler, TickTickAuth, and related UI
- **Translation support**: Removed all 20 language translations (app is now English-only)
- **Donate functionality**: Removed donate button from About screen
- **Server config info box**: Removed outdated wiki link from login (no longer needed with multi-user proxy)
- App now exclusively supports Nextcloud/CalDAV

### Rebranding
- Renamed app to "Tasks NC"
- Version reset to 1.0
- Developer changed to ether-strannik
- Added "Fork of ZeppTasks by melianmiko" credit

### Technical
- Added `device:os.geolocation` permission
- GPS sensor returns DMS objects, converted to decimal degrees
- iCalendar line endings fixed (CRLF per RFC 5545)
- js2ics handles numeric values for PRIORITY

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
| DTSTART     | ✅ | Start date/time |
| DUE         | ✅ | Countdown display |
| DESCRIPTION | ✅ | Notes with icon indicator |
| RELATED-TO  | ✅ | Subtasks hierarchy |
| GEO         | ✅ | GPS coordinates |
| LOCATION    | ✅ | Location text |
| CATEGORIES  | ❌ | Not implemented |
| VALARM      | ❌ | Not implemented |
| RRULE       | ❌ | Not implemented |
