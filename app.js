
(() => {
  "use strict";

  // =====================================
  // 4班人能飞 - Supabase 云端照片墙
  // 第一部分：基础配置和照片墙
  // =====================================

  const SUPABASE_URL =
    "https://mitjykzlyfysxpefiupg.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_oILV8x3jsJZoIgr7Thkm9A_gOstIwVN";

  const TABLE = "gallery_photos";
  const ADMIN_TABLE = "admins";
  const BUCKET = "product-images";
  const TOTAL = 20;

  // 页面元素
  const gallery = document.getElementById("gallery");
  const clock = document.getElementById("beijing-time");
  const count = document.getElementById("photo-count");
  const panel = document.getElementById("admin-panel");
  const select = document.getElementById("slot-select");
  const input = document.getElementById("photo-input");
  const status = document.getElementById("admin-status");
  const toggle = document.getElementById("admin-toggle");
  const closeButton = document.getElementById("admin-close");
  const clearButton = document.getElementById("clear-slot");

  let supabase = null;
  let currentUser = null;
  let photos = {};

  // 显示状态信息
  function showStatus(message, error = false) {
    if (!status) return;

    status.textContent = message;
    status.style.color = error ? "#b42318" : "#287548";
  }

  // 北京时间
  function updateClock() {
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

  // 创建元素
  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
  }

  // 创建空白照片框
  function createPlaceholder() {
    const box = createElement("div", "placeholder");
    const text = createElement("span", "", "尚未添加照片");

    box.appendChild(text);

    return box;
  }

  // 图片大图查看
  function openPhoto(src, alt) {
    if (!src) return;

    const old = document.getElementById("photo-viewer");
    if (old) old.remove();

    const viewer = document.createElement("div");
    viewer.id = "photo-viewer";

    Object.assign(viewer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      background: "rgba(0,0,0,.92)"
    });

    const image = document.createElement("img");
    image.src = src;
    image.alt = alt || "照片大图";

    Object.assign(image.style, {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain"
    });

    const close = createElement("button", "", "×");
    close.type = "button";
    close.setAttribute("aria-label", "关闭大图");

    Object.assign(close.style, {
      position: "absolute",
      top: "12px",
      right: "16px",
      width: "44px",
      height: "44px",
      padding: "0",
      border: "0",
      borderRadius: "50%",
      background: "#fff",
      color: "#111",
      fontSize: "30px",
      cursor: "pointer"
    });

    function removeViewer() {
      viewer.remove();
      document.removeEventListener("keydown", onKey);
    }

    function onKey(event) {
      if (event.key === "Escape") removeViewer();
    }

    close.addEventListener("click", removeViewer);

    viewer.addEventListener("click", event => {
      if (event.target === viewer) removeViewer();
    });

    image.addEventListener("click", event => {
      event.stopPropagation();
    });

    document.addEventListener("keydown", onKey);

    viewer.append(image, close);
    document.body.appendChild(viewer);
  }

  // 渲染 20 个照片区域
  function renderGallery() {
    if (!gallery) return;

    gallery.replaceChildren();

    let totalAdded = 0;

    for (let i = 1; i <= TOTAL; i++) {
      const key = String(i);
      const photo = photos[key];

      const card = createElement("article", "photo-card");
      const frame = createElement("div", "photo-frame");

      if (photo && photo.url) {
        const image = document.createElement("img");

        image.src = photo.url;
        image.alt = `照片区域 ${i}`;
        image.loading = "lazy";
        image.style.cursor = "zoom-in";

        image.addEventListener("click", () => {
          openPhoto(image.currentSrc || image.src, image.alt);
        });

        image.addEventListener("error", () => {
          image.alt = `照片区域 ${i} 加载失败`;
        });

        frame.appendChild(image);
        totalAdded++;
      } else {
        frame.appendChild(createPlaceholder());
      }

      const meta = createElement("div", "card-meta");

      const name = createElement(
        "span",
        "slot-name",
        `照片 ${String(i).padStart(2, "0")}`
      );

      const label = createElement(
        "span",
        "card-action",
        photo ? "已添加" : "待添加"
      );

      meta.append(name, label);
      card.append(frame, meta);
      gallery.appendChild(card);
    }

    if (count) {
      count.textContent = `已添加 ${totalAdded} / ${TOTAL} 张`;
    }
  }

  // 初始化 20 个下拉选项
  function initializeSlots() {
    if (!select) return;

    select.replaceChildren();

    for (let i = 1; i <= TOTAL; i++) {
      const option = document.createElement("option");

      option.value = String(i);
      option.textContent = `照片 ${String(i).padStart(2, "0")}`;

      select.appendChild(option);
    }
  }

  // 后续代码从第二部分继续

  // =====================================
  // 第二部分：管理员登录和云端读取
  // =====================================

  // 创建管理员登录区域
  function initializeLogin() {
    if (!panel) return;

    const loginBox = createElement("div", "");
    loginBox.id = "cloud-login";

    const title = createElement("h3", "", "管理员登录");
    const email = document.createElement("input");
    const password = document.createElement("input");
    const loginButton = createElement("button", "primary", "登录");
    const logoutButton = createElement("button", "quiet", "退出登录");

    email.type = "email";
    email.placeholder = "管理员邮箱";
    email.autocomplete = "username";

    password.type = "password";
    password.placeholder = "管理员密码";
    password.autocomplete = "current-password";

    loginButton.type = "button";
    logoutButton.type = "button";
    logoutButton.hidden = true;

    loginBox.append(title, email, password, loginButton);

    const controls = panel.querySelector(".admin-controls");

    if (controls) {
      panel.insertBefore(loginBox, controls);
      panel.insertBefore(logoutButton, controls);
    } else {
      panel.append(loginBox, logoutButton);
    }

    function showLoggedIn(loggedIn) {
      email.hidden = loggedIn;
      password.hidden = loggedIn;
      loginButton.hidden = loggedIn;
      logoutButton.hidden = !loggedIn;

      if (controls) {
        controls.hidden = !loggedIn;
      }
    }

    showLoggedIn(false);

    loginButton.addEventListener("click", async () => {
      const userEmail = email.value.trim();
      const userPassword = password.value;

      if (!userEmail || !userPassword) {
        showStatus("请输入管理员邮箱和密码。", true);
        return;
      }

      loginButton.disabled = true;
      showStatus("正在登录……");

      try {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: userEmail,
            password: userPassword
          });

        if (error) throw error;

        currentUser = data.user;

        await verifyAdmin();
      } catch (error) {
        currentUser = null;
        showLoggedIn(false);

        showStatus(
          "登录失败：" + (error.message || "请检查账号和密码。"),
          true
        );
      } finally {
        loginButton.disabled = false;
      }
    });

    logoutButton.addEventListener("click", async () => {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        currentUser = null;
        showLoggedIn(false);

        showStatus("已退出管理员账号。");
      } catch (error) {
        showStatus("退出失败：" + error.message, true);
      }
    });

    return {
      showLoggedIn
    };
  }

  const loginUI = initializeLogin();

  // 检查管理员身份
  async function verifyAdmin() {
    if (!currentUser) {
      showStatus("请先登录。", true);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from(ADMIN_TABLE)
        .select("user_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await supabase.auth.signOut();

        currentUser = null;

        if (loginUI) {
          loginUI.showLoggedIn(false);
        }

        showStatus(
          "此账号没有管理员权限，请检查 admins 表。",
          true
        );

        return false;
      }

      if (loginUI) {
        loginUI.showLoggedIn(true);
      }

      showStatus("管理员登录成功。");

      await loadPhotos();

      return true;
    } catch (error) {
      showStatus(
        "管理员验证失败：" + (error.message || "未知错误"),
        true
      );

      return false;
    }
  }

  // 云端读取照片
  async function loadPhotos() {
    if (!supabase) return;

    showStatus("正在读取云端照片……");

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("slot,file_path");

      if (error) throw error;

      const nextPhotos = {};

      for (const row of data || []) {
        const slot = Number(row.slot);
        const path = row.file_path;

        if (
          !Number.isInteger(slot) ||
          slot < 1 ||
          slot > TOTAL ||
          !path
        ) {
          continue;
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);

        nextPhotos[String(slot)] = {
          path,
          url: urlData.publicUrl
        };
      }

      photos = nextPhotos;

      renderGallery();

      showStatus("云端照片读取成功。");

    } catch (error) {
      console.error("读取照片失败：", error);

      showStatus(
        "读取照片失败：" +
        (error.message || "请检查数据库和网络。"),
        true
      );

      renderGallery();
    }
  }

  // 监听登录状态变化
  function watchAuth() {
    if (!supabase) return;

    supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          currentUser = null;

          if (loginUI) {
            loginUI.showLoggedIn(false);
          }

          return;
        }

        if (
          event === "SIGNED_IN" &&
          session &&
          session.user
        ) {
          currentUser = session.user;
          await verifyAdmin();
        }
      }
    );
  }

  // 第三部分继续：上传、替换、清空和启动

  // =====================================
  // 第三部分：上传、替换、清空和启动
  // =====================================

  // 上传照片
  async function uploadPhoto() {
    if (!currentUser) {
      showStatus("请先登录管理员账号。", true);
      return;
    }

    const file = input && input.files && input.files[0];

    if (!file) {
      showStatus("请先选择照片。", true);
      return;
    }

    if (!file.type.startsWith("image/")) {
      showStatus("请选择图片文件。", true);
      input.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showStatus("照片不能超过 3MB，请压缩后重新上传。", true);
      input.value = "";
      return;
    }

    const slot = Number(select && select.value);

    if (!Number.isInteger(slot) || slot < 1 || slot > TOTAL) {
      showStatus("请选择正确的照片区域。", true);
      return;
    }

    const oldPhoto = photos[String(slot)];

    const safeName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const path =
      `slot-${slot}-${Date.now()}-${safeName}`;

    input.disabled = true;
    showStatus("正在上传照片……");

    try {
      // 上传文件到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // 写入数据库
      // 同时写 file_path 和 object_path，
      // 兼容旧表中 object_path 的非空限制。
      const { error: databaseError } = await supabase
        .from(TABLE)
        .upsert(
          {
            slot: slot,
            file_path: path,
            object_path: path,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "slot"
          }
        );

      if (databaseError) {
        await supabase.storage
          .from(BUCKET)
          .remove([path]);

        throw databaseError;
      }

      // 删除被替换的旧照片
      if (oldPhoto && oldPhoto.path) {
        const { error: oldError } = await supabase.storage
          .from(BUCKET)
          .remove([oldPhoto.path]);

        if (oldError) {
          console.warn("旧照片清理失败：", oldError.message);
        }
      }

      await loadPhotos();

      showStatus(`照片区域 ${slot} 上传成功！`);

    } catch (error) {
      console.error("照片上传失败：", error);

      showStatus(
        "上传失败：" + (error.message || "未知错误"),
        true
      );

    } finally {
      input.disabled = false;
      input.value = "";
    }
  }

  // 监听上传
  if (input) {
    input.addEventListener("change", uploadPhoto);
  }

  // 清空当前照片区域
  async function clearPhoto() {
    if (!currentUser) {
      showStatus("请先登录管理员账号。", true);
      return;
    }

    const slot = Number(select && select.value);
    const photo = photos[String(slot)];

    if (!photo) {
      showStatus("这个照片区域目前是空的。", true);
      return;
    }

    const confirmed = confirm(
      `确定清空照片区域 ${slot} 吗？`
    );

    if (!confirmed) return;

    if (clearButton) {
      clearButton.disabled = true;
    }

    showStatus("正在清空照片……");

    try {
      // 先删除数据库记录
      const { error: databaseError } = await supabase
        .from(TABLE)
        .delete()
        .eq("slot", slot);

      if (databaseError) throw databaseError;

      // 再删除 Storage 文件
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([photo.path]);

      if (storageError) {
        console.warn("云端文件清理失败：", storageError.message);
      }

      await loadPhotos();

      showStatus(`照片区域 ${slot} 已清空。`);

    } catch (error) {
      console.error("清空照片失败：", error);

      showStatus(
        "清空失败：" + (error.message || "未知错误"),
        true
      );

    } finally {
      if (clearButton) {
        clearButton.disabled = false;
      }
    }
  }

  if (clearButton) {
    clearButton.addEventListener("click", clearPhoto);
  }

  // 打开管理面板
  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      panel.hidden = false;

      panel.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  // 收起管理面板
  if (closeButton && panel) {
    closeButton.addEventListener("click", () => {
      panel.hidden = true;
    });
  }

  // 初始化网站
  async function start() {
    updateClock();
    setInterval(updateClock, 1000);

    initializeSlots();
    renderGallery();

    // 检查必要页面元素
    if (
      !gallery ||
      !select ||
      !input ||
      !panel ||
      !status ||
      !count
    ) {
      console.error("网页缺少必要元素，请检查 index.html。");
      return;
    }

    // 检查 Supabase 配置
    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      showStatus(
        "Supabase 客户端加载失败，请检查网络和 CDN。",
        true
      );
      return;
    }

    if (
      !SUPABASE_KEY ||
      SUPABASE_KEY.includes("请替换")
    ) {
      showStatus(
        "请先在 app.js 中填写你的 Supabase Publishable Key。",
        true
      );
      return;
    }

    try {
      // 创建 Supabase 客户端
      supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

      // 获取当前登录状态
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      watchAuth();

      if (data.session && data.session.user) {
        currentUser = data.session.user;

        await verifyAdmin();

      } else {
        currentUser = null;

        // 访客读取公开照片
        await loadPhotos();
      }

      console.log("4班人能飞网站初始化完成。");

    } catch (error) {
      console.error("网站初始化失败：", error);

      showStatus(
        "网站连接失败：" + (error.message || "未知错误"),
        true
      );
    }
  }

  // 启动网站
  start();

})();
