(() => {
  const $ = (selector) => document.querySelector(selector);
  let accessToken = null;
  let authMode = "login";
  let supabase = null;

  function toast(message, isError = false) {
    const element = $("#toast");
    element.textContent = message;
    element.style.background = isError ? "#9b3939" : "#20372c";
    element.hidden = false;
    window.setTimeout(() => { element.hidden = true; }, 4500);
  }
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[ch]));
  }
  function openAuth(mode) {
    authMode = mode;
    $("#auth-modal").hidden = false;
    $("#auth-title").textContent = mode === "signup" ? "Create your account" : "Log in";
    $("#auth-submit").textContent = mode === "signup" ? "Create account" : "Log in";
    $("#name-wrap").hidden = mode !== "signup";
    $("#auth-name").required = mode === "signup";
    $("#tab-login").classList.toggle("active", mode === "login");
    $("#tab-signup").classList.toggle("active", mode === "signup");
  }
  async function api(path, options = {}) {
    if (!accessToken) throw new Error("Please log in first.");
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${accessToken}`, ...(options.headers || {}) }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Request failed.");
    return result;
  }
  async function refreshReports() {
    if (!accessToken) {
      $("#message").hidden = false; $("#message").textContent = "Log in to see your reports.";
      $("#reports-list").innerHTML = ""; return;
    }
    try {
      const { reports } = await api("/api/reports");
      const list = $("#reports-list");
      if (!reports.length) {
        $("#message").hidden = false; $("#message").textContent = "No reports yet. Submit your first report above.";
        list.innerHTML = ""; return;
      }
      $("#message").hidden = true;
      list.innerHTML = reports.map(r => `<article class="report-card">
        <div style="display:flex;justify-content:space-between;gap:10px"><h3>${escapeHtml(r.title)}</h3><span class="status ${r.status==="Resolved"?"resolved":r.status==="In Progress"?"progress":""}">${escapeHtml(r.status)}</span></div>
        <p class="report-meta">${escapeHtml(r.category)} · ${escapeHtml(r.location)} · ${r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
        ${r.photo_url ? `<p><a href="${escapeHtml(r.photo_url)}" target="_blank" rel="noopener">View photo</a></p>` : ""}
        <p>${escapeHtml(r.description)}</p>
        <div class="report-actions"><button data-edit="${r.id}">Edit</button><button class="danger" data-delete="${r.id}">Delete</button></div>
      </article>`).join("");
    } catch (error) { toast(error.message, true); }
  }
  async function updateSession(session) {
    accessToken = session?.access_token || null;
    const email = session?.user?.email || "";
    $("#user-label").textContent = email;
    $("#login-open").hidden = !!accessToken;
    $("#signup-open").hidden = !!accessToken;
    $("#logout-btn").hidden = !accessToken;
    await refreshReports();
  }
  async function handleAuth(event) {
    event.preventDefault();
    const button = $("#auth-submit"); button.disabled = true;
    try {
      const email = $("#auth-email").value.trim();
      const password = $("#auth-password").value;
      let result;
      if (authMode === "signup") {
        result = await supabase.auth.signUp({ email, password, options: { data: { full_name: $("#auth-name").value.trim() } } });
        if (result.error) throw result.error;
        if (!result.data.session) {
          toast("Account created. Check your email to confirm, then log in.");
          $("#auth-modal").hidden = true; return;
        }
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
      }
      $("#auth-modal").hidden = true; $("#auth-form").reset();
      toast(authMode === "signup" ? "Account created!" : "Logged in!");
      await updateSession(result.data.session);
    } catch (error) { toast(error.message, true); }
    finally { button.disabled = false; }
  }
  async function createReport(event) {
    event.preventDefault();
    if (!accessToken) { openAuth("login"); toast("Please log in before submitting.", true); return; }
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await api("/api/reports", { method:"POST", body:JSON.stringify({
        title:$("#title").value.trim(), category:$("#category").value,
        location:$("#location").value.trim(), description:$("#description").value.trim(),
        photo_url:$("#photo-url").value.trim() || null
      }) });
      event.currentTarget.reset(); toast("Report submitted successfully."); await refreshReports();
    } catch (error) { toast(error.message, true); }
    finally { button.disabled = false; }
  }
  async function editReport(id) {
    try {
      const { reports } = await api("/api/reports");
      const report = reports.find(item => String(item.id) === String(id));
      if (!report) throw new Error("Report not found.");
      $("#edit-id").value = report.id; $("#edit-title").value = report.title;
      $("#edit-category").value = report.category; $("#edit-location").value = report.location;
      $("#edit-description").value = report.description; $("#edit-modal").hidden = false;
    } catch (error) { toast(error.message, true); }
  }
  async function saveEdit(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button"); button.disabled = true;
    try {
      await api(`/api/reports/${encodeURIComponent($("#edit-id").value)}`, { method:"PUT", body:JSON.stringify({
        title:$("#edit-title").value.trim(), category:$("#edit-category").value,
        location:$("#edit-location").value.trim(), description:$("#edit-description").value.trim()
      }) });
      $("#edit-modal").hidden = true; toast("Report updated."); await refreshReports();
    } catch (error) { toast(error.message, true); }
    finally { button.disabled = false; }
  }
  async function deleteReport(id) {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    try { await api(`/api/reports/${encodeURIComponent(id)}`, { method:"DELETE" }); toast("Report deleted."); await refreshReports(); }
    catch (error) { toast(error.message, true); }
  }
  document.addEventListener("DOMContentLoaded", async () => {
    // The backend serves these settings so browser config stays separate from server secrets.
    try {
      const response = await fetch("/app-config");
      if (response.ok) {
        const config = await response.json();
        window.APP_SUPABASE_URL = config.supabaseUrl;
        window.APP_SUPABASE_PUBLISHABLE_KEY = config.publishableKey;
      }
    } catch (_) {}
    // Recreate the client using the server-provided URL and publishable key.
    if (!window.APP_SUPABASE_URL || !window.APP_SUPABASE_PUBLISHABLE_KEY) {
      toast("Supabase configuration is missing. Check your .env file and restart the server.", true);
      return;
    }
    supabase = window.supabase.createClient(window.APP_SUPABASE_URL, window.APP_SUPABASE_PUBLISHABLE_KEY);
    window.communitySupabase = supabase;
    $("#login-open").onclick = () => openAuth("login");
    $("#signup-open").onclick = () => openAuth("signup");
    $("#tab-login").onclick = () => openAuth("login");
    $("#tab-signup").onclick = () => openAuth("signup");
    document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => $("#auth-modal").hidden = true);
    document.querySelectorAll("[data-edit-close]").forEach(b => b.onclick = () => $("#edit-modal").hidden = true);
    $("#auth-form").addEventListener("submit", handleAuth);
    $("#report-form").addEventListener("submit", createReport);
    $("#edit-form").addEventListener("submit", saveEdit);
    $("#refresh-btn").onclick = refreshReports;
    $("#logout-btn").onclick = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) toast(error.message, true);
      else { toast("Logged out."); await updateSession(null); }
    };
    $("#reports-list").addEventListener("click", e => {
      const edit = e.target.closest("[data-edit]"), del = e.target.closest("[data-delete]");
      if (edit) editReport(edit.dataset.edit);
      if (del) deleteReport(del.dataset.delete);
    });
    const { data, error } = await supabase.auth.getSession();
    if (error) toast(error.message, true);
    await updateSession(data.session);
    supabase.auth.onAuthStateChange((_event, session) => setTimeout(() => updateSession(session), 0));
  });
})();
