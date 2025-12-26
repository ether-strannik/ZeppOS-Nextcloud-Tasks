import { ConfiguredListScreen } from "../ConfiguredListScreen";
import { readLog, clearLog, clearAllLogs, syncLogToPhone } from "../Utils";

const { config, t, tasksProvider } = getApp()._options.globalData

class SettingsScreen extends ConfiguredListScreen {
  constructor(params) {
    super();

    params = JSON.parse(params);
    this.mode = params.mode;
    this.lists = params.lists;
    this.fromReplace = params.fromReplace;

    // Fallback to cached lists if none provided
    if ((!this.lists || this.lists.length === 0) && tasksProvider.hasCachedLists()) {
      const cachedLists = config.get("cachedLists", []);
      this.lists = cachedLists.map(l => ({ id: l.id, title: l.title }));
    }

    this.wipeConfirm = 3;
  }

  build() {
    // Lists picker - show if we have lists (online or cached)
    if(this.lists && this.lists.length > 0) {
      this.headline(t('Task lists:'));
      this.lists.forEach(({ id, title }) => this.row({
        text: title,
        icon: "icon_s/list.png",
        callback: () => this.applyList(id)
      }));
    }

    // UI settings
    if(this.mode !== "setup") {
      this.headline(t("User interface:"));
      this.row({
        text: t("Font size…"),
        icon: "icon_s/font_size.png",
        callback: () => hmApp.gotoPage({
          url: `page/amazfit/FontSizeSetupScreen`
        })
      });
      this.row({
        text: t("Keyboard…"),
        icon: "icon_s/keyboard.png",
        callback: () => hmApp.gotoPage({
          url: `page/amazfit/ScreenBoardSetup`
        })
      });
      if(this.mode !== "cached" && tasksProvider && !tasksProvider.cantListCompleted)
        this.row({
          text: t("Show complete tasks"),
          icon:  `icon_s/cb_${config.get("withComplete", false)}.png`,
          callback: () => {
            config.set("withComplete", !config.get("withComplete", false));
            hmApp.goBack();
          }
        })
      this.row({
        text: t("Sort alphabetically"),
        icon: `icon_s/cb_${config.get("sortMode", "none") === "alpha"}.png`,
        callback: () => {
          const current = config.get("sortMode", "none");
          config.set("sortMode", current === "alpha" ? "none" : "alpha");
          hmApp.goBack();
        }
      });
      this.row({
        text: t("Show reminder countdown"),
        icon: `icon_s/cb_${config.get("showCountdown", false)}.png`,
        callback: () => {
          config.set("showCountdown", !config.get("showCountdown", false));
          hmApp.goBack();
        }
      });
      this.row({
        text: t("Show categories"),
        icon: `icon_s/cb_${config.get("showCategories", false)}.png`,
        callback: () => {
          config.set("showCategories", !config.get("showCategories", false));
          hmApp.goBack();
        }
      });
      this.row({
        text: t("Pull down to refresh"),
        icon: `icon_s/cb_${config.get("pullToRefresh", false)}.png`,
        callback: () => {
          config.set("pullToRefresh", !config.get("pullToRefresh", false));
          hmApp.goBack();
        }
      });
      this.row({
        text: t("Work offline"),
        icon: `icon_s/cb_${config.get("offlineMode", false)}.png`,
        callback: () => {
          config.set("offlineMode", !config.get("offlineMode", false));
          hmApp.goBack();
        }
      });
    }

    // Advanced settings
    if(this.mode !== "setup") {
      this.headline(t("Advanced:"));
      if(config.get("forever_offline", false)) {
        this.row({
          text: t("Remove completed tasks"),
          icon: "icon_s/cleanup.png",
          callback: () => this.offlineRemoveComplete()
        })
      }
      this.row({
        text: t("Wipe ALL local data"),
        icon: "icon_s/wipe_all.png",
        callback: () => this.wipeEverything()
      });
      if(this.mode !== "offline") this.text({
        text: t("Option above didn't delete any data from your Google account"),
        fontSize: this.fontSize - 2,
        color: 0x999999
      });

      // Debug section
      this.offset(16);
      this.headline(t("Debug:"));
      this.row({
        text: t("View debug log"),
        icon: "icon_s/edit.png",
        callback: () => this.showDebugLog()
      });
      this.row({
        text: t("Sync log to phone"),
        icon: "icon_s/link.png",
        callback: () => this.syncLog()
      });
      this.row({
        text: t("Clear debug log"),
        icon: "icon_s/delete.png",
        callback: () => {
          clearLog();  // Clear watch log immediately
          clearAllLogs().then(() => {
            hmUI.showToast({ text: t("All logs cleared") });
          }).catch(() => {
            hmUI.showToast({ text: t("Watch log cleared") });
          });
        }
      });
    }

    // About section at the bottom
    if(this.mode !== "setup") this.buildHelpItems();

    this.offset();
  }

  applyList(id) {
    config.set("cur_list_id", id);

    const rq = {
      url: `page/amazfit/HomeScreen`
    };

    this.fromReplace ? hmApp.reloadPage(rq) : hmApp.goBack();
  }

  wipeEverything() {
    if(this.wipeConfirm > 0) {
      this.wipeConfirm--;
      return hmUI.showToast({text: t("Tap again to confirm")});
    }

    config.wipe();
    hmApp.goBack();
  }

  offlineRemoveComplete() {
    const storage = config.get("tasks", []);
    const output = []
    for(const task of storage) {
      if(!task.completed)
        output.push(task);
    }
    config.set("tasks", output);
    hmApp.goBack();
  }

  showDebugLog() {
    const logContent = readLog();
    // Navigate to About screen with log content as param
    hmApp.gotoPage({
      url: `page/amazfit/AboutScreen`,
      param: JSON.stringify({ debugLog: logContent })
    });
  }

  syncLog() {
    hmUI.showToast({ text: t("Syncing...") });
    syncLogToPhone().then((resp) => {
      if (resp && resp.error) {
        hmUI.showToast({ text: resp.error });
      } else {
        hmUI.showToast({ text: t("Log synced to phone") });
      }
    }).catch((e) => {
      hmUI.showToast({ text: t("Sync failed") });
    });
  }

  buildHelpItems() {
    this.row({
      text: t("About…"),
      icon: "icon_s/about.png",
      callback: () => hmApp.gotoPage({
        url: `page/amazfit/AboutScreen`,
        param: JSON.stringify({})
      })
    });
    // this.row({
    //   text: t("Help index"),
    //   icon: "icon_s/help.png",
    //   callback: () => hmApp.gotoPage({
    //     url: `page/amazfit/MarkdownReader`,
    //     param: "index.md"
    //   })
    // });
  }
}

// noinspection JSCheckFunctionSignatures
Page({
  onInit(params) {
    hmUI.setStatusBarVisible(true);
    hmUI.updateStatusBarTitle("");

    new SettingsScreen(params).build();
  }
})
