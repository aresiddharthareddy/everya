const store = {
  user: localStorage.getItem("user") || "alex",
  likes: JSON.parse(localStorage.getItem("likes") || "{}"),
  saves: JSON.parse(localStorage.getItem("saves") || "{}"),
  comments: JSON.parse(localStorage.getItem("comments") || "{}"),
  reported: JSON.parse(localStorage.getItem("reported") || "{}"),
  traceFollows: JSON.parse(localStorage.getItem("traceFollows") || "{}"),
  memberships: JSON.parse(localStorage.getItem("memberships") || "{}"),
  subscriptions: JSON.parse(localStorage.getItem("subscriptions") || "{}"),
  drafts: JSON.parse(localStorage.getItem("drafts") || "[]"),
  notifRead: JSON.parse(localStorage.getItem("notifRead") || "{}"),
};
const persist = () => {
  localStorage.setItem("user", store.user);
  localStorage.setItem("likes", JSON.stringify(store.likes));
  localStorage.setItem("saves", JSON.stringify(store.saves));
  localStorage.setItem("comments", JSON.stringify(store.comments));
  localStorage.setItem("reported", JSON.stringify(store.reported));
  localStorage.setItem("traceFollows", JSON.stringify(store.traceFollows));
  localStorage.setItem("memberships", JSON.stringify(store.memberships));
  localStorage.setItem("subscriptions", JSON.stringify(store.subscriptions));
  localStorage.setItem("drafts", JSON.stringify(store.drafts));
  localStorage.setItem("notifRead", JSON.stringify(store.notifRead));
};

const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const user = (u) => DATA.users.find((x) => x.username === u) || { username: u, name: u, bio: "" };
const trace = (u, s) => DATA.traces.find((t) => t.username === u && t.slug === s);
const doc = (u, s, d) => trace(u, s)?.docs.find((x) => x.slug === d);
const draftDoc = (u, s, d) => trace(u, s)?.draftDocs?.find((x) => x.slug === d);
const pub = (h) => DATA.publications.find((p) => p.handle === h);
const canEditTrace = (u) => store.user === u || store.user === "alex" || store.user === "infraops";
const hasMembership = (creator, tier) => {
  const m = store.memberships[creator];
  if (!m || m.status !== "ACTIVE") return false;
  if (tier === "PREMIUM") return m.tier === "PREMIUM";
  return true;
};
const canAccessDoc = (item, owner) => {
  if (!item.accessLevel || item.accessLevel === "PUBLIC") return true;
  if (canEditTrace(owner)) return true;
  if (item.accessLevel === "MEMBERS") return hasMembership(owner, "MEMBER");
  if (item.accessLevel === "PREMIUM") return hasMembership(owner, "PREMIUM");
  return false;
};
const accessBadge = (level) => level && level !== "PUBLIC" ? `<span class="badge">${level}</span>` : "";

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
  const m = { document: "Doc", publication: "Pub", trace: "Trace", draft: "Draft" };
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

function contributorsHtml(contributors) {
  if (!contributors?.length) return "";
  return `<h2 class="section">Contributors</h2>
    <div class="contributors">${contributors.map((c) => `
      <a class="chip" href="#/profile/${c.username}">@${esc(c.username)} <small>${esc(c.role)}</small></a>`).join("")}</div>`;
}

function docNavFooter(u, s, item) {
  const t = trace(u, s);
  if (!item.prev && !item.next) return "";
  const prev = item.prev ? t.docs.find((d) => d.slug === item.prev) : null;
  const next = item.next ? t.docs.find((d) => d.slug === item.next) : null;
  return `<nav class="doc-nav">
    ${prev ? `<a class="nav-link" href="#/u/${u}/trace/${s}/${prev.slug}">← ${esc(prev.title)}</a>` : "<span></span>"}
    <a class="nav-link center" href="#/u/${u}/trace/${s}">${esc(t.name)}</a>
    ${next ? `<a class="nav-link right" href="#/u/${u}/trace/${s}/${next.slug}">${esc(next.title)} →</a>` : "<span></span>"}
  </nav>`;
}

function viewFeed() {
  const localDrafts = store.drafts.map((d) => ({
    id: d.id, type: "draft", title: d.title, excerpt: d.excerpt, author: store.user,
    trace: "My drafts", traceSlug: "_", docSlug: d.id, minutes: d.minutes,
  }));
  const items = DATA.feed.concat(localDrafts);
  return `<div class="banner">Offline preview v${DATA.version} — demo data saved locally on this device.</div>
    <h1 class="page-title">Home</h1>
    <p class="lede">Stories and trace documents from the EVERYA demo catalog.</p>
    ${items.map(feedCard).join("")}
    ${store.drafts.length ? `<a class="btn" href="#/drafts">View ${store.drafts.length} local draft(s)</a>` : ""}`;
}

function viewDrafts() {
  const seed = DATA.traces.flatMap((t) =>
    (canEditTrace(t.username) ? (t.draftDocs || []) : []).map((d) => ({
      title: d.title, excerpt: d.excerpt, href: `#/u/${t.username}/trace/${t.slug}/${d.slug}`,
      source: t.name,
    }))
  );
  const local = store.drafts.map((d) => ({
    title: d.title, excerpt: d.excerpt, href: `#/drafts/${d.id}`, source: "Local draft",
  }));
  const all = [...seed, ...local];
  return `<h1 class="page-title">Drafts</h1>
    <p class="lede">Unpublished documents you can continue editing.</p>
    ${all.length ? all.map((d) => `
      <a class="card" href="${d.href}">
        ${badge("draft")}
        <div class="meta">${esc(d.source)}</div>
        <div class="title">${esc(d.title)}</div>
        <p class="excerpt">${esc(d.excerpt)}</p>
      </a>`).join("") : `<p class="lede">No drafts. Create one from the Create tab.</p>`}
    <a class="btn" href="#/create">New draft</a>`;
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

function knowledgeSection(u, s, d) {
  const item = doc(u, s, d);
  if (!item?.links?.length) return "";
  const rows = item.links.map((l) => {
    const href = `#/u/${u}/trace/${s}/${l.target}`;
    const tag = l.inbound ? "Referenced by" : l.type.replace(/_/g, " ");
    return `<a class="tree-item" href="${href}"><span>${esc(tag)}</span><span>${esc(l.label)}</span></a>`;
  }).join("");
  return `<h2 class="section">Knowledge</h2><div class="tree">${rows}</div>`;
}

function viewTraceKnowledge(u, s, docSlug) {
  const t = trace(u, s);
  if (!t) return `<p>Trace not found.</p>`;
  const selected = docSlug || t.docs[0]?.slug;
  const edges = t.docs.flatMap((d) =>
    (d.links || []).map((l) => ({ from: d.slug, to: l.target, type: l.type, label: l.label }))
  );
  const related = (DATA.traceLinks || []).filter((l) => l.from === `${u}/${s}`);
  return `<h1 class="page-title">Knowledge · ${esc(t.name)}</h1>
    <a class="btn" href="#/u/${u}/trace/${s}">← Back to trace</a>
    <h2 class="section">Documents</h2>
    <div class="tree">${t.docs.map((d) => `<a class="tree-item ${d.slug===selected?"on":""}" href="#/u/${u}/trace/${s}/knowledge/${d.slug}">${esc(d.title)}</a>`).join("")}</div>
    <h2 class="section">Connections</h2>
    <div class="tree">${edges.filter((e) => e.from === selected).map((e) => `<a class="tree-item" href="#/u/${u}/trace/${s}/${e.to}"><span>${esc(e.type)}</span><span>${esc(e.label)}</span></a>`).join("") || `<p class="lede">No links.</p>`}</div>
    ${related.length ? `<h2 class="section">Related traces</h2><div class="chips">${related.map((r) => `<a class="chip" href="#/u/${r.to.replace("/","/trace/")}">${esc(r.label)}</a>`).join("")}</div>` : ""}`;
}

function viewTrace(u, s) {
  const t = trace(u, s);
  if (!t) return `<p>Trace not found.</p>`;
  const key = `${u}/${s}`;
  const following = !!store.traceFollows[key];
  const tree = t.docs.map((d) => `
    <a class="tree-item" href="#/u/${u}/trace/${s}/${d.slug}">
      <span>${esc(d.title)} ${d.accessLevel && d.accessLevel !== "PUBLIC" ? `<small>· ${d.accessLevel}</small>` : ""}</span>
      <small>${d.minutes} min</small>
    </a>`).join("");
  const drafts = canEditTrace(u) ? (t.draftDocs || []) : [];
  const draftList = drafts.map((d) => `
    <a class="tree-item draft" href="#/u/${u}/trace/${s}/${d.slug}">
      <span>${esc(d.title)}</span>
      <small>Draft</small>
    </a>`).join("");
  return `<div class="meta">@${esc(u)}</div>
    <h1 class="page-title">${esc(t.name)}</h1>
    <p class="lede">${esc(t.description)}</p>
    <div class="row">
      <button class="btn solid" onclick="toggleTraceFollow('${u}','${s}')">${following ? "Following" : "Follow trace"}</button>
      <button class="btn" onclick="shareLink('#/u/${u}/trace/${s}')">Share</button>
      <a class="btn" href="#/profile/${u}">Profile</a>
      <a class="btn" href="#/u/${u}/trace/${s}/knowledge">Knowledge map</a>
    </div>
    ${contributorsHtml(t.contributors)}
    ${draftList ? `<h2 class="section">Drafts</h2><div class="tree">${draftList}</div>` : ""}
    <h2 class="section">Documents</h2>
    <div class="tree">${tree}</div>`;
}

function commentBlock(id, comments) {
  const list = (comments || []).map((c, i) => {
    const reported = store.reported[`${id}:${i}`];
    return `<div class="comment" id="c-${id}-${i}">
      <div class="row between">
        <strong>${esc(c.author || "You")}</strong>
        <div class="row">
          ${!reported ? `<button class="link-btn" onclick="reportComment('${id}',${i})">Report</button>` : `<span class="meta">Reported</span>`}
          ${c.author === store.user || c.author === "You" ? `<button class="link-btn danger" onclick="deleteComment('${id}',${i})">Delete</button>` : ""}
        </div>
      </div>
      <p>${esc(c.text)}</p>
    </div>`;
  }).join("");
  return `${list || `<p class="lede">No comments yet.</p>`}`;
}

function viewDoc(u, s, d, isDraft) {
  const item = isDraft ? draftDoc(u, s, d) : doc(u, s, d);
  if (!item) return `<p>Document not found.</p>`;
  if (isDraft && !canEditTrace(u)) return `<p>This draft is not available.</p>`;
  const allowed = canAccessDoc(item, u);
  const id = `${u}/${s}/${d}`;
  const liked = !!store.likes[id];
  const saved = !!store.saves[id];
  const comments = store.comments[id] || [];
  const editor = item.lastEditor && item.lastEditor !== item.author ? item.lastEditor : null;
  return `<div id="read-progress" class="read-progress"></div>
    <div class="meta">@${esc(u)} · ${esc(trace(u,s).name)} · ${item.minutes} min${isDraft ? " · Draft" : ""}</div>
    <h1 class="page-title">${esc(item.title)}</h1>${accessBadge(item.accessLevel)}
    ${editor ? `<p class="lede">Written by @${esc(item.author)} · Last edited by @${esc(editor)}</p>` : `<p class="lede">By @${esc(item.author || u)}</p>`}
    <div class="row">
      <button class="chip ${liked?"on":""}" onclick="toggleLike('${id}')">${liked?"Liked":"Like"}</button>
      <button class="chip ${saved?"on":""}" onclick="toggleSave('${id}')">${saved?"Saved":"Save"}</button>
      <button class="chip" onclick="shareLink('#/u/${u}/trace/${s}/${d}')">Share</button>
      <a class="chip" href="#/u/${u}/trace/${s}">Trace</a>
      ${isDraft ? `<a class="chip" href="#/create">Edit draft</a>` : ""}
    </div>
    ${allowed ? `<article class="body" id="article-body">${md(item.content)}</article>` : `<div class="card flat"><p class="lede"><strong>${esc(item.accessLevel)} content.</strong> Join membership to read this document.</p><a class="btn solid" href="#/memberships">View memberships</a></div>`}
    ${!isDraft ? knowledgeSection(u, s, d) : ""}
    ${!isDraft ? docNavFooter(u, s, item) : ""}
    <section id="discussion">
      <h2 class="section">Discussion</h2>
      <textarea id="c" placeholder="Write a comment…"></textarea>
      <button class="btn solid" onclick="addComment('${id}')">Post</button>
      ${commentBlock(id, comments)}
    </section>`;
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
    <button class="btn" onclick="shareLink('#/p/${h}')">Share</button>
    <h2 class="section">Articles</h2>${articles}`;
}

function viewPubArticle(h, s) {
  const p = pub(h);
  const a = p?.articles.find((x) => x.slug === s);
  if (!a) return `<p>Article not found.</p>`;
  return `<div class="meta">@${esc(a.author)} · ${esc(p.name)}</div>
    <h1 class="page-title">${esc(a.title)}</h1>
    <div class="row"><button class="chip" onclick="shareLink('#/p/${h}/${s}')">Share</button></div>
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
    ${cards || `<p class="lede">Nothing saved yet. Tap Save on any document.</p>`}
    <a class="btn" href="#/drafts">My drafts</a>`;
}

function viewNotifications() {
  return `<h1 class="page-title">Notifications</h1>
    ${DATA.notifications.map((n) => {
      const read = store.notifRead[n.id] || n.read;
      const href = n.href || "#/";
      return `<a class="card flat ${read?"read":""}" href="${href}" onclick="markRead('${n.id}')">
        <div class="meta">${esc(n.type)} · @${esc(n.actor)}</div>
        <div class="title">${esc(n.title)}</div>
        <p class="excerpt">${esc(n.message)}</p>
      </a>`;
    }).join("")}`;
}

function viewCreator(u) {
  const c = DATA.creators.find((x) => x.username === u) || { username: u, tagline: user(u).bio, members: 0, plans: 0 };
  const plans = DATA.membershipPlans.filter((p) => p.creator === u);
  return `<div class="meta">Creator</div>
    <h1 class="page-title">${esc(user(u).name)}</h1>
    <p class="lede">${esc(c.tagline)}</p>
    <div class="stats"><span>${c.members} members</span><span>${c.plans} plans</span></div>
    <a class="btn" href="#/profile/${u}">Public profile</a>
    <h2 class="section">Plans</h2>
    ${plans.map((p) => `<div class="card flat"><div class="title">${esc(p.name)}</div><p class="excerpt">${esc(p.tier)} · $${(p.priceCents/100).toFixed(2)}/mo</p></div>`).join("")}
    <a class="btn solid" href="#/memberships">Memberships</a>`;
}

function viewMemberships() {
  const mine = Object.entries(store.memberships).map(([creator, m]) => `<div class="card flat"><div class="title">@${esc(creator)}</div><p class="excerpt">${esc(m.tier)} · ${esc(m.status)}</p></div>`).join("");
  const plans = DATA.membershipPlans.map((p) => `
    <div class="card flat">
      <div class="title">${esc(p.name)}</div>
      <p class="excerpt">@${esc(p.creator)} · ${esc(p.tier)} · $${(p.priceCents/100).toFixed(2)}/mo</p>
      <button class="btn solid" onclick="joinPlan('${p.id}','${p.creator}','${p.tier}')">Join (demo)</button>
    </div>`).join("");
  const payNote = DATA.paymentConfigured ? "" : `<p class="lede">Payment provider not configured — demo membership only (no fake payment success).</p>`;
  return `<h1 class="page-title">Memberships</h1>
    <p class="lede">Membership ≠ follow. This grants content access.</p>
    ${payNote}
    <h2 class="section">Your memberships</h2>${mine || `<p class="lede">None yet.</p>`}
    <h2 class="section">Available plans</h2>${plans}
    <a class="btn" href="#/creator/${store.user}">Creator dashboard</a>`;
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
    <button class="btn" onclick="shareLink('#/profile/${u}')">Share profile</button>
    ${p.isCreator ? `<a class="btn" href="#/creator/${u}">Creator profile</a>` : ""}
    <div class="stats"><span>${p.followers} followers</span><span>${p.following} following</span></div>
    <h2 class="section">Traces</h2>${traces || `<p class="lede">No traces.</p>`}
    ${u !== store.user ? `<button class="btn solid" onclick="switchUser('${u}')">View as @${esc(u)}</button>` : ""}`;
}

function viewCreate() {
  return `<h1 class="page-title">Create</h1>
    <p class="lede">Drafts are saved locally. Publish is available in the hosted app.</p>
    <input id="wt" class="input" placeholder="Title" />
    <textarea id="wb" class="input tall" placeholder="Write in Markdown…"></textarea>
    <div class="row">
      <button class="btn solid" onclick="saveDraft()">Save draft</button>
      <button class="btn" onclick="alert('Publishing requires the hosted EveryA app.')">Publish</button>
    </div>`;
}

function viewLogin() {
  const users = DATA.users.map((u) => `
    <button class="btn ${store.user===u.username?"solid":""}" onclick="switchUser('${u.username}')">@${esc(u.username)} — ${esc(u.name)}</button>`).join("");
  return `<h1 class="page-title">Demo account</h1>
    <p class="lede">Pick a demo user. Data is stored on this phone only.</p>
    <div class="stack">${users}</div>`;
}

function viewLocalDraft(id) {
  const d = store.drafts.find((x) => x.id === id);
  if (!d) return `<p>Draft not found.</p>`;
  return `<div class="meta">Local draft</div>
    <h1 class="page-title">${esc(d.title)}</h1>
    <article class="body">${md(d.content)}</article>
    <a class="btn" href="#/create">Continue editing</a>`;
}

window.shareLink = (hashPath) => {
  const url = location.href.split("#")[0] + hashPath;
  if (navigator.share) {
    navigator.share({ title: "EVERYA", url }).catch(() => {});
    return;
  }
  navigator.clipboard?.writeText(url).then(() => alert("Link copied"));
};
window.toggleLike = (id) => { store.likes[id] = !store.likes[id]; persist(); route(); };
window.toggleSave = (id) => { store.saves[id] = !store.saves[id]; persist(); route(); };
window.toggleTraceFollow = (u, s) => { const k = `${u}/${s}`; store.traceFollows[k] = !store.traceFollows[k]; persist(); route(); };
window.addComment = (id) => {
  const el = document.getElementById("c");
  if (!el?.value.trim()) return;
  store.comments[id] = store.comments[id] || [];
  store.comments[id].push({ text: el.value.trim(), author: store.user });
  persist(); route();
};
window.deleteComment = (id, i) => {
  if (!confirm("Delete this comment?")) return;
  store.comments[id]?.splice(i, 1);
  persist(); route();
};
window.reportComment = (id, i) => {
  const reason = prompt("Why are you reporting this comment?");
  if (!reason?.trim()) return;
  store.reported[`${id}:${i}`] = true;
  persist(); route();
};
window.saveDraft = () => {
  const title = document.getElementById("wt")?.value.trim();
  const content = document.getElementById("wb")?.value.trim();
  if (!title || !content) return alert("Add a title and body.");
  if (!confirm("Save as draft?")) return;
  store.drafts.unshift({
    id: "d" + Date.now(), title, content, excerpt: content.slice(0, 140),
    author: store.user, minutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
  });
  persist();
  location.hash = "#/drafts";
};
window.switchUser = (u) => { store.user = u; persist(); location.hash = "#/profile/" + u; };
window.joinPlan = (id, creator, tier) => {
  if (!DATA.paymentConfigured) {
    store.memberships[creator] = { planId: id, tier, status: "ACTIVE" };
    persist();
    alert("Demo membership activated (no payment processed).");
    route();
    return;
  }
  alert("Checkout requires hosted app with Stripe configured.");
};
window.markRead = (id) => { store.notifRead[id] = true; persist(); };

function navTab(path, label, icon) {
  const active = (location.hash.slice(1).split("~")[0] || "/").startsWith(path.replace("#", ""));
  return `<a class="tab ${active?"on":""}" href="${path}"><span>${icon}</span>${label}</a>`;
}

function bindReadingProgress() {
  const bar = document.getElementById("read-progress");
  const body = document.getElementById("article-body");
  if (!bar || !body) return;
  const main = document.querySelector("main");
  const onScroll = () => {
    const rect = body.getBoundingClientRect();
    const total = body.offsetHeight - window.innerHeight * 0.4;
    const scrolled = Math.max(0, -rect.top);
    const pct = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
    bar.style.width = pct + "%";
  };
  main?.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function scrollToAnchor(anchor) {
  if (!anchor) return;
  const el = document.getElementById(anchor);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function route() {
  const raw = location.hash.slice(1) || "/";
  const [path, anchor] = raw.split("~");
  const parts = path.split("/").filter(Boolean);
  let html = "";
  if (parts[0] === "explore") html = viewExplore();
  else if (parts[0] === "library") html = viewLibrary();
  else if (parts[0] === "drafts" && parts[1]) html = viewLocalDraft(parts[1]);
  else if (parts[0] === "drafts") html = viewDrafts();
  else if (parts[0] === "create") html = viewCreate();
  else if (parts[0] === "notifications") html = viewNotifications();
  else if (parts[0] === "login") html = viewLogin();
  else if (parts[0] === "creator" && parts[1]) html = viewCreator(parts[1]);
  else if (parts[0] === "memberships") html = viewMemberships();
  else if (parts[0] === "profile" && parts[1]) html = viewProfile(parts[1]);
  else if (parts[0] === "u" && parts[2] === "trace" && parts[4] === "knowledge") html = viewTraceKnowledge(parts[1], parts[3], parts[5]);
  else if (parts[0] === "u" && parts[2] === "trace" && parts[3] && parts[4] && parts[4] !== "knowledge") {
    const isDraft = !!draftDoc(parts[1], parts[3], parts[4]) && !doc(parts[1], parts[3], parts[4]);
    html = viewDoc(parts[1], parts[3], parts[4], isDraft);
  }
  else if (parts[0] === "u" && parts[2] === "trace" && parts[3]) html = viewTrace(parts[1], parts[3]);
  else if (parts[0] === "p" && parts[1] && parts[2]) html = viewPubArticle(parts[1], parts[2]);
  else if (parts[0] === "p" && parts[1]) html = viewPub(parts[1]);
  else html = viewFeed();

  document.getElementById("app").innerHTML = html;
  document.getElementById("tabs").innerHTML = [
    navTab("#/", "Home", "⌂"),
    navTab("#/explore", "Explore", "◎"),
    navTab("#/create", "Create", "✎"),
    navTab("#/drafts", "Drafts", "▤"),
    navTab("#/profile/" + store.user, "You", "◉"),
  ].join("");
  const unread = DATA.notifications.filter((n) => !(store.notifRead[n.id] || n.read)).length;
  document.getElementById("notif-badge").textContent = unread ? String(unread) : "";
  document.getElementById("notif-badge").style.display = unread ? "inline-flex" : "none";
  bindReadingProgress();
  if (anchor) setTimeout(() => scrollToAnchor(anchor), 50);
  else window.scrollTo(0, 0);
}

addEventListener("hashchange", route);
route();
