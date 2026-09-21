const store = {
  user: localStorage.getItem("user") || "alex",
  likes: JSON.parse(localStorage.getItem("likes") || "{}"),
  saves: JSON.parse(localStorage.getItem("saves") || "{}"),
  comments: JSON.parse(localStorage.getItem("comments") || "{}"),
  traceFollows: JSON.parse(localStorage.getItem("traceFollows") || "{}"),
  drafts: JSON.parse(localStorage.getItem("drafts") || "[]"),
  notifRead: JSON.parse(localStorage.getItem("notifRead") || "{}"),
};
const persist = () => {
  localStorage.setItem("user", store.user);
  localStorage.setItem("likes", JSON.stringify(store.likes));
  localStorage.setItem("saves", JSON.stringify(store.saves));
  localStorage.setItem("comments", JSON.stringify(store.comments));
  localStorage.setItem("traceFollows", JSON.stringify(store.traceFollows));
  localStorage.setItem("drafts", JSON.stringify(store.drafts));
  localStorage.setItem("notifRead", JSON.stringify(store.notifRead));
};

const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const user = (u) => DATA.users.find((x) => x.username === u) || { username: u, name: u, bio: "" };
const trace = (u, s) => DATA.traces.find((t) => t.username === u && t.slug === s);
const doc = (u, s, d) => trace(u, s)?.docs.find((x) => x.slug === d);
const pub = (h) => DATA.publications.find((p) => p.handle === h);

function md(src) {
  return esc(src)
    .replace(/^### (.*)$/gm,"<h3>$1</h3>")
    .replace(/^## (.*)$/gm,"<h2>$1</h2>")
    .replace(/^# (.*)$/gm,"<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/`([^`]+)`/g,"<code>$1</code>")
    .replace(/```[\s\S]*?```/g, (m) => "<pre>" + m.replace(/```/g,"") + "</pre>")
    .replace(/^> (.*)$/gm,"<blockquote>$1</blockquote>")
    .replace(/\n\n/g,"</p><p>")
    .replace(/^/, "<p>").replace(/$/, "</p>");
}

function badge(t) {
  const m = { document: "Doc", publication: "Pub", trace: "Trace" };
  return `<span class="badge">${m[t] || t}</span>`;
}

function feedCard(item) {
  const href = item.type === "publication"
    ? `#/p/${item.handle}/${item.slug}`
    : `#/u/${item.author}/trace/${item.traceSlug}/${item.docSlug}`;
  return `<a class="card" href="${href}">
    ${badge(item.type || "document")}
    <div class="meta">@${esc(item.author)} · ${esc(item.trace || item.pub || "")} · ${item.minutes} min</div>
    <div class="title">${esc(item.title)}</div>
    <p class="excerpt">${esc(item.excerpt)}</p>
  </a>`;
}

function viewFeed() {
  const items = DATA.feed.concat(store.drafts.map((d) => ({
    id: d.id, type: "document", title: d.title, excerpt: d.excerpt, author: store.user,
    trace: "Drafts", traceSlug: "_", docSlug: d.id, minutes: d.minutes,
  })));
  return `<div class="banner">Offline preview — dummy seed data, saved locally on this device.</div>
    <h1 class="page-title">Home</h1>
    <p class="lede">Stories and trace documents from the EVERYA demo catalog.</p>
    ${items.map(feedCard).join("")}`;
}

function viewExplore() {
  const traces = DATA.traces.map((t) => `
    <a class="card" href="#/u/${t.username}/trace/${t.slug}">
      <span class="badge">Trace</span>
      <div class="meta">@${esc(t.username)} · ${t.docs.length} docs · ${t.followers} followers</div>
      <div class="title">${esc(t.name)}</div>
      <p class="excerpt">${esc(t.description)}</p>
    </a>`).join("");
  const pubs = DATA.publications.map((p) => `
    <a class="card" href="#/p/${p.handle}">
      <span class="badge">Pub</span>
      <div class="meta">@${esc(p.owner)} · ${p.followers} followers</div>
      <div class="title">${esc(p.name)}</div>
      <p class="excerpt">${esc(p.description)}</p>
    </a>`).join("");
  const tags = DATA.exploreTags.map((t) => `<span class="chip">#${esc(t)}</span>`).join("");
  return `<h1 class="page-title">Explore</h1>
    <div class="chips">${tags}</div>
    <h2 class="section">Traces</h2>${traces}
    <h2 class="section">Publications</h2>${pubs}`;
}

function viewTrace(u, s) {
  const t = trace(u, s);
  if (!t) return `<p>Trace not found.</p>`;
  const key = `${u}/${s}`;
  const following = !!store.traceFollows[key];
  const tree = t.docs.map((d) => `
    <a class="tree-item" href="#/u/${u}/trace/${s}/${d.slug}">
      <span>${esc(d.title)}</span>
      <small>${d.minutes} min</small>
    </a>`).join("");
  return `<div class="meta">@${esc(u)}</div>
    <h1 class="page-title">${esc(t.name)}</h1>
    <p class="lede">${esc(t.description)}</p>
    <div class="row">
      <button class="btn solid" onclick="toggleTraceFollow('${u}','${s}')">${following ? "Following" : "Follow trace"}</button>
      <a class="btn" href="#/profile/${u}">Profile</a>
    </div>
    <h2 class="section">Documents</h2>
    <div class="tree">${tree}</div>`;
}

function viewDoc(u, s, d) {
  const item = doc(u, s, d);
  if (!item) return `<p>Document not found.</p>`;
  const id = `${u}/${s}/${d}`;
  const liked = !!store.likes[id];
  const saved = !!store.saves[id];
  const comments = store.comments[id] || [];
  return `<div class="meta">@${esc(u)} · ${esc(trace(u,s).name)} · ${item.minutes} min</div>
    <h1 class="page-title">${esc(item.title)}</h1>
    <div class="row">
      <button class="chip ${liked?"on":""}" onclick="toggleLike('${id}')">${liked?"Liked":"Like"}</button>
      <button class="chip ${saved?"on":""}" onclick="toggleSave('${id}')">${saved?"Saved":"Save"}</button>
      <a class="chip" href="#/u/${u}/trace/${s}">Go to trace</a>
    </div>
    <article class="body">${md(item.content)}</article>
    <h2 class="section">Discussion</h2>
    <textarea id="c" placeholder="Write a comment…"></textarea>
    <button class="btn solid" onclick="addComment('${id}')">Post</button>
    ${comments.map((c) => `<div class="comment"><strong>You</strong><p>${esc(c)}</p></div>`).join("") || `<p class="lede">No comments yet.</p>`}`;
}

function viewPub(h) {
  const p = pub(h);
  if (!p) return `<p>Publication not found.</p>`;
  const articles = p.articles.map((a) => `
    <a class="card" href="#/p/${h}/${a.slug}">
      <div class="meta">@${esc(a.author)} · ${a.minutes} min</div>
      <div class="title">${esc(a.title)}</div>
      <p class="excerpt">${esc(a.excerpt)}</p>
    </a>`).join("");
  return `<div class="meta">Publication</div>
    <h1 class="page-title">${esc(p.name)}</h1>
    <p class="lede">${esc(p.description)}</p>
    <h2 class="section">Articles</h2>${articles}`;
}

function viewPubArticle(h, s) {
  const p = pub(h);
  const a = p?.articles.find((x) => x.slug === s);
  if (!a) return `<p>Article not found.</p>`;
  return `<div class="meta">@${esc(a.author)} · ${esc(p.name)}</div>
    <h1 class="page-title">${esc(a.title)}</h1>
    <article class="body">${md(a.content)}</article>
    <a class="btn" href="#/p/${h}">Back to publication</a>`;
}

function viewLibrary() {
  const saved = Object.keys(store.saves).filter((k) => store.saves[k]);
  const cards = saved.map((id) => {
    const [u, s, d] = id.split("/");
    const item = doc(u, s, d);
    if (!item) return "";
    return feedCard({ type: "document", author: u, trace: trace(u,s)?.name, traceSlug: s, docSlug: d, title: item.title, excerpt: item.excerpt, minutes: item.minutes });
  }).filter(Boolean).join("");
  return `<h1 class="page-title">Library</h1>
    <p class="lede">Saved documents on this device.</p>
    ${cards || `<p class="lede">Nothing saved yet. Tap Save on any document.</p>`}`;
}

function viewNotifications() {
  return `<h1 class="page-title">Notifications</h1>
    ${DATA.notifications.map((n) => {
      const read = store.notifRead[n.id] || n.read;
      return `<div class="card flat ${read?"read":""}" onclick="markRead('${n.id}')">
        <div class="meta">${esc(n.type)} · @${esc(n.actor)}</div>
        <div class="title">${esc(n.title)}</div>
        <p class="excerpt">${esc(n.message)}</p>
      </div>`;
    }).join("")}`;
}

function viewProfile(u) {
  const p = user(u);
  const traces = DATA.traces.filter((t) => t.username === u).map((t) => `
    <a class="card" href="#/u/${u}/trace/${t.slug}">
      <div class="title">${esc(t.name)}</div>
      <p class="excerpt">${t.docs.length} documents</p>
    </a>`).join("");
  return `<h1 class="page-title">${esc(p.name)}</h1>
    <div class="meta">@${esc(u)}</div>
    <p class="lede">${esc(p.bio)}</p>
    <div class="stats"><span>${p.followers} followers</span><span>${p.following} following</span></div>
    <h2 class="section">Traces</h2>${traces || `<p class="lede">No traces.</p>`}
    ${u !== store.user ? `<button class="btn solid" onclick="switchUser('${u}')">View as @${esc(u)}</button>` : ""}`;
}

function viewCreate() {
  return `<h1 class="page-title">Create</h1>
    <p class="lede">Drafts are saved locally on this device.</p>
    <input id="wt" class="input" placeholder="Title" />
    <textarea id="wb" class="input tall" placeholder="Write in Markdown…"></textarea>
    <button class="btn solid" onclick="saveDraft()">Save draft</button>`;
}

function viewLogin() {
  const users = DATA.users.map((u) => `
    <button class="btn ${store.user===u.username?"solid":""}" onclick="switchUser('${u.username}')">@${esc(u.username)} — ${esc(u.name)}</button>`).join("");
  return `<h1 class="page-title">Demo account</h1>
    <p class="lede">Pick a demo user. Data is stored on this phone only.</p>
    <div class="stack">${users}</div>`;
}

window.toggleLike = (id) => { store.likes[id] = !store.likes[id]; persist(); route(); };
window.toggleSave = (id) => { store.saves[id] = !store.saves[id]; persist(); route(); };
window.toggleTraceFollow = (u, s) => { const k = `${u}/${s}`; store.traceFollows[k] = !store.traceFollows[k]; persist(); route(); };
window.addComment = (id) => {
  const el = document.getElementById("c");
  if (!el?.value.trim()) return;
  store.comments[id] = store.comments[id] || [];
  store.comments[id].push(el.value.trim());
  persist(); route();
};
window.saveDraft = () => {
  const title = document.getElementById("wt")?.value.trim();
  const content = document.getElementById("wb")?.value.trim();
  if (!title || !content) return alert("Add a title and body.");
  store.drafts.unshift({
    id: "d" + Date.now(), title, content, excerpt: content.slice(0, 140),
    author: store.user, minutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
  });
  persist();
  location.hash = "#/library";
};
window.switchUser = (u) => { store.user = u; persist(); location.hash = "#/profile/" + u; };
window.markRead = (id) => { store.notifRead[id] = true; persist(); route(); };

function navTab(path, label, icon) {
  const active = (location.hash.slice(1) || "/").startsWith(path.replace("#", ""));
  return `<a class="tab ${active?"on":""}" href="${path}"><span>${icon}</span>${label}</a>`;
}

function route() {
  const h = location.hash.slice(1) || "/";
  const parts = h.split("/").filter(Boolean);
  let html = "";
  if (parts[0] === "explore") html = viewExplore();
  else if (parts[0] === "library") html = viewLibrary();
  else if (parts[0] === "create") html = viewCreate();
  else if (parts[0] === "notifications") html = viewNotifications();
  else if (parts[0] === "login") html = viewLogin();
  else if (parts[0] === "profile" && parts[1]) html = viewProfile(parts[1]);
  else if (parts[0] === "u" && parts[2] === "trace" && parts[3] && parts[4]) html = viewDoc(parts[1], parts[3], parts[4]);
  else if (parts[0] === "u" && parts[2] === "trace" && parts[3]) html = viewTrace(parts[1], parts[3]);
  else if (parts[0] === "p" && parts[1] && parts[2]) html = viewPubArticle(parts[1], parts[2]);
  else if (parts[0] === "p" && parts[1]) html = viewPub(parts[1]);
  else html = viewFeed();

  document.getElementById("app").innerHTML = html;
  document.getElementById("tabs").innerHTML = [
    navTab("#/", "Home", "⌂"),
    navTab("#/explore", "Explore", "◎"),
    navTab("#/create", "Create", "✎"),
    navTab("#/library", "Library", "▤"),
    navTab("#/profile/" + store.user, "You", "◉"),
  ].join("");
  const unread = DATA.notifications.filter((n) => !(store.notifRead[n.id] || n.read)).length;
  document.getElementById("notif-badge").textContent = unread ? String(unread) : "";
  document.getElementById("notif-badge").style.display = unread ? "inline-flex" : "none";
  window.scrollTo(0, 0);
}

addEventListener("hashchange", route);
route();
