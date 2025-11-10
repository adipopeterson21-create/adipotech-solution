const apiBase = 'https://adipotech-backend.onrender.com';

function id(i) { return document.getElementById(i); }

// Disable login system — everyone is treated as a guest
function token() { return 'guest'; }
function setToken(t) {}
function clearToken() {}

async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  // No Authorization header needed for public access
  const res = await fetch(apiBase + path, opts);
  if (!res.ok) {
    console.error('API error:', res.status);
    throw new Error('API error');
  }
  return res.json();
}

document.addEventListener('DOMContentLoaded', () => {
  const appMain = id('app'),
    materials = id('materials'),
    aiArea = id('aiArea'),
    chatBox = id('chatBox'),
    adminPanel = id('adminPanel'),
    uploadForm = id('uploadForm');

  // 🟢 Removed all login/register modal logic
  // Users can now directly access content without authentication.

  async function init() {
    appMain.removeAttribute('aria-hidden');
    try {
      const contents = await api('/api/contents');
      materials.innerHTML = '<h3>Materials</h3>';
      contents.forEach(c => {
        const d = document.createElement('div');
        d.innerHTML = `<strong>${c.title}</strong><p>${c.description || ''}</p>`;
        materials.appendChild(d);
      });
      // Always show AI assistant to all users
      aiArea.classList.remove('hidden');
    } catch (e) {
      console.error(e);
      materials.innerHTML = '<p>Failed to load materials.</p>';
    }
  }
  async function loadContent() {
  const res = await fetch('/api/contents');
  const data = await res.json();
  const container = document.getElementById('materials');
  container.innerHTML = '';

  if (!data.length) {
    container.innerHTML = '<p>No content available yet.</p>';
    return;
  }

  data.forEach(item => {
    const el = document.createElement('div');
    el.className = 'content-card';
    el.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <a href="${item.fileUrl}" target="_blank">Open</a>
    `;
    container.appendChild(el);
  });
}
loadContent();


  uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('file', id('file').files[0]);
    form.append('title', id('title').value);
    form.append('description', id('desc').value);
    form.append('type', id('type').value);
    form.append('premium', id('isPremium').checked ? 'true' : 'false');

    try {
      // Upload will fail unless backend allows public upload
      const res = await fetch(apiBase + '/api/admin/upload', {
        method: 'POST',
        body: form
      });
      const j = await res.json();
      if (j.success) alert('Uploaded');
      else alert('Upload failed');
    } catch (e) {
      console.error(e);
      alert('Upload error');
    }
  });

  id('aiForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = id('aiInput').value.trim();
    if (!prompt) return;
    const you = document.createElement('div');
    you.textContent = 'You: ' + prompt;
    chatBox.appendChild(you);
    id('aiInput').value = '';
    const spinner = document.createElement('div');
    spinner.textContent = 'AI is typing...';
    chatBox.appendChild(spinner);
    try {
      const res = await api('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      spinner.remove();
      const a = document.createElement('div');
      a.innerHTML = '<strong>AI:</strong> ' + (res.answer || 'No answer');
      chatBox.appendChild(a);
    } catch (e) {
      spinner.remove();
      console.error(e);
      alert('AI error');
    }
  });

  // Initialize automatically — no login required
  init();
});
