(() => {
  "use strict";

  // Supabase 配置（publishable key 可以公开；千万不要放 secret / service_role 密钥）
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