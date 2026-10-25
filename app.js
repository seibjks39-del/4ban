(() => {
  "use strict";

  // Supabase 配置
  const SUPABASE_URL =
    "https://mitjykzlyfysxpefiupg.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oILV8x3jsJZoIgr7Thkm9A_gOstIwVN";

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
    if (status) status.textContent = text;
  }

  // 显示北京时间
  function updateClock() {
    const clock = document.getElementById("beijing-time");
    if (!clock) return;

    clock.textContent = new Intl.DateTimeFormat("zh-CN", {
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

  // 点击照片查看大图
  function openPhoto(src, alt) {
    if (!src) return;

    const existing = document.getElementById("photo-viewer");
    if (existing) existing.remove();

    const viewer = document.createElement("div");
    viewer.id = "photo-viewer";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "照片大图查看器");

    Object.assign(viewer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      background: "rgba(0,0,0,0.92)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      boxSizing: "border-box"
    });

    const image = document.createElement("img");
    image.src = src;
    image.alt = alt || "照片大图";

    Object.assign(image.style, {
      display: "block",
      maxWidth: "100%",
      maxHeight: "100%",
      width: "auto",
      height: "auto",
      objectFit: "contain",
      borderRadius: "4px"
    });

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "关闭大图");

    Object.assign(close.style, {
      position: "absolute",
      top: "12px",
      right: "16px",
      width: "44px",
      height: "44px",
      border: "0",
      borderRadius: "50%",
      background: "#fff",
      color: "#111",
      fontSize: "32px",
      lineHeight: "1",
      cursor: "pointer"
    });

    const closeViewer = () => {
      viewer.remove();
      document.removeEventListener("keydown", onKeyDown);
    };

    const onKeyDown = event => {
      if (event.key === "Escape") closeViewer();
    };

    close.addEventListener("click", closeViewer);

    viewer.addEventListener("click", event => {
      if (event.target === viewer) closeViewer();
    });

    image.addEventListener("click", event => {
      event.stopPropagation();
    });

    document.addEventListener("keydown", onKeyDown);

    viewer.append(image, close);
    document.body.appendChild(viewer);
    close.focus();
  }

  // 渲染 20 个照片区域
  function render() {
    if (!gallery || !count) return;

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
          openPhoto(img.currentSrc || img.src, img.alt);
        });

        img.addEventListener("error", () => {
          img.alt = `照片区域 ${i} 加载失败`;
        });

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

  // 管理员登录界面
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

    if (controls) controls.hidden = true;

    login.addEventListener("click", async () => {
      if (!client) {
        message("Supabase 客户端尚未初始化，请检查网络和配置。");
        return;
      }

      if (!email.value.trim() || !password.value) {
        message("请输入管理员邮箱和密码。");
        return;
      }

      login.disabled = true;
      message("正在登录…");

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.value.trim(),
          password: password.value
        });

        if (error) throw error;

        currentUser = data.user;
        await checkAdminAndLoad();
      } catch (err) {
        message("登录失败：" + (err.message || "请检查账号、密码和网络。"));
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
      try {
        if (client) await client.auth.signOut();
      } finally {
        currentUser = null;

        if (controls) controls.hidden = true;

        logout.hidden = true;
        email.hidden = false;
        password.hidden = false;
        login.hidden = false;

        message("已退出登录。");
      }
    });

    if (!panel || !controls) {
      console.error(
        "缺少 #admin-panel 或 .admin-controls 元素，请检查 index.html。"
      );
    } else {
      panel.insertBefore(area, controls);
      panel.insertBefore(logout, controls);
    }

    return {
      area,
      email,
      password,
      login,
      logout,
      controls
    };
  }

  // 创建照片区域下拉菜单
  if (select) {
    for (let i = 1; i <= TOTAL; i++) {
      const option = document.createElement("option");

      option.value = String(i);
      option.textContent = `照片 ${String(i).padStart(2, "0")}`;

      select.appendChild(option);
    }
  }

  const ui = buildLoginUI();

  // 从 Supabase 读取照片
  async function loadPhotos() {
    if (!client) {
      throw new Error("Supabase 客户端尚未初始化。");
    }

    const { data, error } = await client
      .from("gallery_photos")
      .select("slot, file_path");

    if (error) throw error;

    const nextPhotos = {};

    for (const row of data || []) {
      if (!row.file_path) continue;

      const { data: urlData } = client.storage
        .from(BUCKET)
        .getPublicUrl(row.file_path);

      nextPhotos[String(row.slot)] = {
        path: row.file_path,
        url: urlData.publicUrl
      };
    }

    photos = nextPhotos;
    render();
  }

  // 检查管理员权限
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

      message(
        error
          ? "无法验证管理员权限：" + error.message
          : "此账号不是管理员，请检查 admins 表中的 user_id。"
      );

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

  // 上传照片
  if (input) {
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
      con