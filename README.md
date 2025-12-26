# ZeppOS Nextcloud Tasks

> **🔄 Nextcloud-Focused Fork** of [melianmiko/ZeppOS-Tasks](https://github.com/melianmiko/ZeppOS-Tasks)  
> This version focuses exclusively on Nextcloud/CalDAV synchronization.

## ⚠️ Major Changes from Original
- Focus: Nextcloud/CalDAV only
- Other sync providers (Google, Microsoft) will be removed/deprecated
- Enhanced Nextcloud-specific features
- Simplified configuration

---

## Build Instructions

Required software:
- Python 3.10+
- NodeJS and [ZeppOS CLI Tools](https://docs.zepp.com/docs/guides/tools/cli/)

### Nextcloud Setup
To be added

### Building

Clone this project **recursively**:
```bash
git clone --recursive https://github.com/ether-strannik/ZeppOS-Nextcloud-Tasks.git
```

Build assets for all devices:
```bash
python3 prepare_all.py
```

Build and preview using zeus toolchain:
```bash
zeus preview
```

---

**Original project:** [melianmiko/ZeppOS-Tasks](https://github.com/melianmiko/ZeppOS-Tasks)