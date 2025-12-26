import {ConfiguredListScreen} from "../ConfiguredListScreen";
import {ScreenBoard} from "../../lib/mmk/ScreenBoard";
import {createSpinner} from "../Utils";

const { t, config, tasksProvider } = getApp()._options.globalData

class CategoryPickerScreen extends ConfiguredListScreen {
  constructor(param) {
    super();

    param = JSON.parse(param);
    this.listId = param.listId;
    this.taskId = param.taskId;
    this.currentCategories = param.currentCategories || [];

    // Selected categories (copy of current to allow editing)
    this.selected = [...this.currentCategories];

    // Get predefined categories from config
    this.predefinedCategories = config.get("userCategories", []);

    // Merge: include all predefined + any task categories not in predefined
    this.allCategories = [...this.predefinedCategories];
    for (const cat of this.currentCategories) {
      if (!this.allCategories.includes(cat)) {
        this.allCategories.push(cat);
      }
    }
  }

  build() {
    this.headline(t("Categories"));

    if (this.allCategories.length === 0) {
      this.text({
        text: t("No categories defined. Add one below."),
        fontSize: this.fontSize - 2,
        color: 0x999999
      });
    }

    // Show all categories with checkboxes
    this.categoryRows = [];
    for (const category of this.allCategories) {
      const isSelected = this.selected.includes(category);
      const row = this.row({
        text: category,
        icon: `icon_s/cb_${isSelected}.png`,
        callback: () => this.toggleCategory(category)
      });
      this.categoryRows.push({ category, row });
    }

    // Add new category option
    this.offset(16);
    this.row({
      text: t("Add new category..."),
      icon: "icon_s/new.png",
      callback: () => this.showAddCategoryEditor()
    });

    // Delete category option (only show if there are categories)
    if (this.allCategories.length > 0) {
      this.row({
        text: t("Delete category..."),
        icon: "icon_s/delete.png",
        callback: () => this.enterDeleteMode()
      });
    }

    // Save button
    this.offset(16);
    this.row({
      text: t("Save"),
      icon: "icon_s/cb_true.png",
      callback: () => this.saveCategories()
    });

    this.offset();

    // Setup ScreenBoard for adding new category
    this.addCategoryBoard = new ScreenBoard();
    this.addCategoryBoard.title = t("New category");
    this.addCategoryBoard.value = "";
    this.addCategoryBoard.confirmButtonText = t("Add");
    this.addCategoryBoard.onConfirm = (v) => this.doAddCategory(v);
    this.addCategoryBoard.visible = false;
  }

  toggleCategory(category) {
    // If in delete mode, delete the category instead of toggling
    if (this.deleteMode) {
      this.deleteCategory(category);
      return;
    }

    const index = this.selected.indexOf(category);
    if (index >= 0) {
      // Remove from selection
      this.selected.splice(index, 1);
    } else {
      // Add to selection
      this.selected.push(category);
    }

    // Update UI
    for (const item of this.categoryRows) {
      if (item.category === category) {
        const isSelected = this.selected.includes(category);
        item.row.iconView.setProperty(hmUI.prop.SRC, `icon_s/cb_${isSelected}.png`);
        break;
      }
    }
  }

  showAddCategoryEditor() {
    this.addCategoryBoard.visible = true;
    hmApp.setLayerY(0);
    hmUI.setLayerScrolling(false);
  }

  enterDeleteMode() {
    // Change all category rows to delete mode (red X icons)
    this.deleteMode = true;
    for (const item of this.categoryRows) {
      item.row.iconView.setProperty(hmUI.prop.SRC, "icon_s/delete.png");
    }
    hmUI.showToast({ text: t("Tap category to delete") });
  }

  deleteCategory(category) {
    // Remove from predefined categories
    const userCategories = config.get("userCategories", []);
    const index = userCategories.indexOf(category);
    if (index >= 0) {
      userCategories.splice(index, 1);
      config.set("userCategories", userCategories);
    }

    // Remove from current selection if selected
    const selIndex = this.selected.indexOf(category);
    if (selIndex >= 0) {
      this.selected.splice(selIndex, 1);
    }

    // Reload page to show updated list
    hmApp.reloadPage({
      url: "page/amazfit/CategoryPickerScreen",
      param: JSON.stringify({
        listId: this.listId,
        taskId: this.taskId,
        currentCategories: this.selected
      })
    });
  }

  doAddCategory(name) {
    if (!name || !name.trim()) {
      hmUI.showToast({ text: t("Name required") });
      return;
    }

    name = name.trim();

    // Check if already exists
    if (this.allCategories.includes(name)) {
      hmUI.showToast({ text: t("Category exists") });
      return;
    }

    // Add to predefined categories in config
    const userCategories = config.get("userCategories", []);
    userCategories.push(name);
    config.set("userCategories", userCategories);

    // Add to current selection
    this.allCategories.push(name);
    this.selected.push(name);

    // Reload page to show new category
    hmApp.reloadPage({
      url: "page/amazfit/CategoryPickerScreen",
      param: JSON.stringify({
        listId: this.listId,
        taskId: this.taskId,
        currentCategories: this.selected
      })
    });
  }

  saveCategories() {
    const task = tasksProvider.getTaskList(this.listId).getTask(this.taskId);

    if (typeof task.setCategories !== 'function') {
      hmUI.showToast({ text: t("Not supported") });
      return;
    }

    const hideSpinner = createSpinner();

    // Sync task first to load rawData, then set categories
    task.sync().then(() => {
      return task.setCategories(this.selected);
    }).then((resp) => {
      hideSpinner();
      if (resp && resp.error) {
        hmUI.showToast({ text: resp.error });
        return;
      }
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
    hmUI.updateStatusBarTitle(t("Categories"));

    new CategoryPickerScreen(param).build();
  }
})
