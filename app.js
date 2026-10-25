
(() => {
  "use strict";

  // 替换成你自己的 Supabase 项目 URL 和 Publishable key
  const SUPABASE_URL = "https://mitjykzlyfysxpefiupg.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oILV8x3jsJZoIgr7Thkm9A_gOstIwVN";

  const TOTAL = 20;
  const BUCKET = "product-images";

  const gallery = document.getElementById("gallery");
  const select = document.getElementById("slot-select");
  const input = document.getElementById("photo-input");
  const panel = document.getElementById("admin-panel");
  const status = document.getElementById("admin-status");
  const count = document.getElementById("photo-count");

  let photos = {};
  let client = null;
  let currentUser = null;

  function message(text) {
    status.textContent = text;
  }

  function updateClock() {
    document.getElementById("beijing-time").textContent =
      new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(new Date());
  }

  function placeholder() {
    const box = document.createElement("div");
    box.className = "placeholder";
    const span = document.createElement("span");
    span.textContent = "尚未添加照片";
    box.appendChild(span);
    return box;
  }

  function render() {
    gallery.replaceChildren();
    let added = 0;

    for (let i = 1; i <= TOTAL; i++) {
      const key = String(i);
      const card = document.createElement("article");
      card.className = "photo-card";

      const frame = document.createElement("div");
      frame.className = "photo-frame";

      if (photos[key] && photos[key].url) {
        const img = document.createElement("img");

img.src = photos[key].url;
img.alt = `照片区域 ${i}`;
img.loading = "lazy";
img.style.cursor = "zoom-in";
img.addEventListener("click", () => {
  openPhoto(img.src, img.alt);
});
frame.appendChild(img);

        frame.appendChild(img);
        added++;
      } else {
        frame.appendChild(placeholder());
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

  function makeElement(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function buildLoginUI() {
    const area = document.createElement("div");
    area.id = "cloud-login";

    const email = document.createElement("input");
    email.type = "email";
    email.placeholder = "管理员邮箱";
    email.autocomplete = "username";
    email.setAttribute("aria-label", "管理员邮箱");

    const password = document.createElement("input");
    password.type = "password";
    password.placeholder = "管理员密码";
    password.autocomplete = "current-password";
    password.setAttribute("aria-label", "管理员密码");

    const login = makeElement("button", "管理员登录", "primary");
    login.type = "button";

    const controls = document.querySelector(".admin-controls");
    controls.hidden = true;

    login.addEventListener("click", async () => {
      if (!client) {
        message("请先填写 Supabase 项目 URL 和 Publishable key。");
        return;
      }

      login.disabled = true;
      message("正在登录…");

      try {
        const { data, error } =
          await client.auth.signInWithPassword({
            email: email.value.trim(),
            password: password.value
          });

        if (error) throw error;

        currentUser = data.user;
        await checkAdminAndLoad();
      } catch (err) {
        message("登录失败：" + err.message);
      } finally {
        login.disabled = false;
      }
    });

    area.append(
      makeElement("p", "请使用已创建的管理员账号登录。"),
      email,
      password,
      login
    );

    const logout = makeElement("button", "退出登录", "quiet");
    logout.type = "button";
    logout.hidden = true;
    logout.id = "cloud-logout";

    logout.addEventListener("click", async () => {
      await client.auth.signOut();
      currentUser = null;
      controls.hidden = true;
      logout.hidden = true;
      email.hidden = false;
      password.hidden = false;
      login.hidden = false;
      message("已退出登录。");
    });

    panel.insertBefore(area, controls);
    panel.insertBefore(logout, controls);

    return { area, email, password, login, logout, controls };
  }

  // 先建立照片区域下拉选项
  for (let i = 1; i <= TOTAL; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `照片 ${String(i).padStart(2, "0")}`;
    select.appendChild(option);
  }

  const ui = buildLoginUI();

  async function loadPhotos() {
    const { data, error } = await client
      .from("gallery_photos")
      .select("slot, file_path");

    if (error) throw error;

    photos = {};
    for (const row of data || []) {
      const { data: urlData } = client.storage
        .from(BUCKET)
        .getPublicUrl(row.file_path);

      photos[String(row.slot)] = {
        path: row.file_path,
        url: urlData.publicUrl
      };
    }

    render();
  }

  async function checkAdminAndLoad() {
    const { data: admin, error } = await client
      .from("admins")
      .select("user_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error || !admin) {
      await client.auth.signOut();
      currentUser = null;
      ui.controls.hidden = true;
      ui.logout.hidden = true;
      ui.email.hidden = false;
      ui.password.hidden = false;
      ui.login.hidden = false;
      message("此账号不是管理员，请检查 admins 表中的 user_id。");
      return;
    }

    ui.controls.hidden = false;
    ui.logout.hidden = false;
    ui.email.hidden = true;
    ui.password.hidden = true;
    ui.login.hidden = true;

    message("管理员已登录，可以管理照片。");
    await loadPhotos();
  }

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;

    if (!currentUser) {
      message("请先登录管理员账号。");
      input.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      message("请选择图片文件。");
      input.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      message("图片不能超过 3 MB，请先压缩后再上传。");
      input.value = "";
      return;
    }

    const slot = Number(select.value);
    const old = photos[String(slot)];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `slot-${slot}-${Date.now()}-${safeName}`;

    input.disabled = true;
    message("正在上传照片…");

    try {
      const { error: uploadError } = await client.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await client
        .from("gallery_photos")
        .upsert(
          { slot, file_path: path, updated_at: new Date().toISOString() },
          { onConflict: "slot" }
        );

      if (dbError) {
        await client.storage.from(BUCKET).remove([path]);
        throw dbError;
      }

      if (old && old.path) {
        await client.storage.from(BUCKET).remove([old.path]);
      }

      message(`照片 ${slot} 上传成功。`);
      await loadPhotos();
    } catch (err) {
      message("上传失败：" + err.message);
    } finally {
      input.disabled = false;
      input.value = "";
    }
  });

  document.getElementById("clear-slot").addEventListener("click", async () => {
    const slot = Number(select.value);
    const old = photos[String(slot)];

    if (!currentUser) {
      message("请先登录管理员账号。");
      return;
    }

    if (!old) {
      message(`照片 ${slot} 目前为空。`);
      return;
    }

    if (!confirm(`确定清空照片 ${slot} 吗？`)) return;

    try {
      const { error } = await client
        .from("gallery_photos")
        .delete()
        .eq("slot", slot);

      if (error) throw error;

      await client.storage.from(BUCKET).remove([old.path]);
      message(`照片 ${slot} 已清空。`);
      await loadPhotos();
    } catch (err) {
      message("清空失败：" + err.message);
    }
  });

  document.getElementById("admin-toggle").addEventListener("click", () => {
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("admin-close").addEventListener("click", () => {
    panel.hidden = true;
  });

  document.getElementById("admin-toggle")
    .setAttribute("aria-controls", "admin-panel");

  async function start() {
    updateClock();
    render();
    setInterval(updateClock, 1000);

    if (
      SUPABASE_URL.includes("YOUR_SUPABASE") ||
      SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE")
    ) {
      message("请先在 app.js 开头填写 Supabase URL 和 Publishable key。");
      return;
    }

    if (!window.supabase || !window.supabase.createClient) {
      message("Supabase 客户端加载失败，请检查 index.html 中的 CDN 脚本。");
      return;
    }

    try {
      client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );

      const { data } = await client.auth.getSession();
      if (data.session) {
        currentUser = data.session.user;
        await checkAdminAndLoad();
      } else {
        message("请登录管理员账号后管理照片。");
        // 公开展示区不要求登录
        try {
          await loadPhotos();
        } catch (err) {
          message("读取照片失败，请检查 gallery_photos 表和读取策略。");
        }
      }
    } catch (err) {
      message("连接失败：" + err.message);
    }
  }

  start();
})();
