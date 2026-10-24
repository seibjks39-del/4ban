(() => {
  "use strict";
  const TOTAL = 20;
  const STORAGE_KEY = "class-gallery-v1";
  const gallery = document.getElementById("gallery");
  const select = document.getElementById("slot-select");
  const input = document.getElementById("photo-input");
  const panel = document.getElementById("admin-panel");
  const status = document.getElementById("admin-status");
  const count = document.getElementById("photo-count");
  let photos = loadPhotos();

  function loadPhotos() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) { return {}; }
  }
  function savePhotos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
      return true;
    } catch (_) {
      status.textContent = "保存失败：图片可能太大，请尝试选择较小的图片。";
      return false;
    }
  }
  function updateClock() {
    const now = new Date();
    document.getElementById("beijing-time").textContent =
      new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit",
        day: "2-digit", weekday: "short", hour: "2-digit",
        minute: "2-digit", second: "2-digit", hour12: false
      }).format(now);
  }
  function placeholder() {
    return `<div class="placeholder" aria-label="尚未添加照片">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m21 15-5-5L5 20"></path></svg>
      <span>点击管理添加照片</span></div>`;
  }
  function render() {
    gallery.innerHTML = "";
    let added = 0;
    for (let i = 1; i <= TOTAL; i++) {
      const key = String(i);
      const card = document.createElement("article");
      card.className = "photo-card";
      const frame = document.createElement("div");
      frame.className = "photo-frame";
      if (photos[key]) {
        const img = document.createElement("img");
        img.src = photos[key];
        img.alt = `照片区域 ${i}`;
        img.loading = "lazy";
        frame.appendChild(img);
        added++;
      } else {
        frame.innerHTML = placeholder();
      }
      const meta = document.createElement("div");
      meta.className = "card-meta";
      const name = document.createElement("span");
      name.className = "slot-name";
      name.textContent = `照片 ${String(i).padStart(2, "0")}`;
      const action = document.createElement("span");
      action.className = "card-action";
      action.textContent = photos[key] ? "已添加" : "待添加";
      meta.append(name, action);
      card.append(frame, meta);
      gallery.appendChild(card);
    }
    count.textContent = `已添加 ${added} / ${TOTAL} 张`;
  }
  for (let i = 1; i <= TOTAL; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `照片 ${String(i).padStart(2, "0")}`;
    select.appendChild(option);
  }
  document.getElementById("admin-toggle").addEventListener("click", () => {
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("admin-close").addEventListener("click", () => { panel.hidden = true; });
  document.getElementById("admin-toggle").setAttribute("aria-controls", "admin-panel");
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      status.textContent = "请选择图片文件。"; input.value = ""; return;
    }
    if (file.size > 3 * 1024 * 1024) {
      status.textContent = "图片不能超过 3 MB，请先压缩图片后再上传。";
      input.value = ""; return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const key = select.value;
      const old = photos[key];
      photos[key] = reader.result;
      if (savePhotos()) {
        status.textContent = `已保存到照片 ${key}。`;
        render();
      } else {
        if (old) photos[key] = old; else delete photos[key];
      }
      input.value = "";
    };
    reader.onerror = () => { status.textContent = "读取图片失败，请重新选择。"; };
    reader.readAsDataURL(file);
  });
  document.getElementById("clear-slot").addEventListener("click", () => {
    const key = select.value;
    if (!photos[key]) { status.textContent = `照片 ${key} 目前为空。`; return; }
    if (!confirm(`确定清空照片 ${key} 吗？`)) return;
    const old = photos[key];
    delete photos[key];
    if (savePhotos()) { status.textContent = `已清空照片 ${key}。`; render(); }
    else photos[key] = old;
  });
  updateClock();
  setInterval(updateClock, 1000);
  render();
})(); 
