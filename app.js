  const closeBtn = document.getElementById("admin-close");

  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      panel.hidden = false;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  if (closeBtn && panel) {
    closeBtn.addEventListener("click", () => {
      panel.hidden = true;
    });
  }

  // 页面初始化
  updateClock();
  setInterval(updateClock, 1000);
  render();

  if (window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    // 所有访客打开页面就读取照片
    loadPhotos().catch(err => message("读取照片失败：" + err.message));

    // 如果之前登录过，自动恢复管理员状态
    client.auth.getSession().then(({ data }) => {
      if (data && data.session) {
        currentUser = data.session.user;
        checkAdminAndLoad().catch(() => {});
      }
    });
  } else {
    message("Supabase 库未加载，请检查网络或 index.html。");
  }
})();
