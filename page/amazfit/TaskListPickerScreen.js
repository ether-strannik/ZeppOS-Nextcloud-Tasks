import { ConfiguredListScreen } from "../ConfiguredListScreen";

const { config, t, tasksProvider } = getApp()._options.globalData

class TaskListPickerScreen extends ConfiguredListScreen {
  constructor(params) {
    super();

    params = JSON.parse(params);
    this.lists = params.lists || [];
    this.mode = params.mode;

    // Fallback to cached lists if none provided
    if (this.lists.length === 0 && tasksProvider.hasCachedLists()) {
      const cachedLists = config.get("cachedLists", []);
      this.lists = cachedLists.map(l => ({ id: l.id, title: l.title }));
    }
  }

  build() {
    // Task lists
    this.headline(t("Task lists:"));

    if (this.lists.length === 0) {
      this.text({
        text: t("No lists available"),
        color: 0x999999
      });
    } else {
      this.lists.forEach(({ id, title }) => {
        this.row({
          text: title,
          icon: "icon_s/list.png",
          callback: () => this.selectList(id)
        });
      });
    }

    // Settings button
    this.offset(16);
    this.row({
      text: t("Settings"),
      icon: "icon_s/link.png",
      callback: () => this.openSettings()
    });

    this.offset();
  }

  selectList(id) {
    config.set("cur_list_id", id);
    hmApp.goBack();
  }

  openSettings() {
    hmApp.gotoPage({
      url: "page/amazfit/SettingsScreen",
      param: JSON.stringify({
        mode: this.mode
      })
    });
  }
}

Page({
  onInit(params) {
    hmUI.setStatusBarVisible(true);
    hmUI.updateStatusBarTitle("");

    new TaskListPickerScreen(params).build();
  }
})
