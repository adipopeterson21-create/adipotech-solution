const apiBase = 'https://adipotech-solution.onrender.com';

function id(i) { return document.getElementById(i); }
function token() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function clearToken() { localStorage.removeItem('token'); location.reload(); }

async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  if (token()) opts.headers['Authorization'] = 'Bearer ' + token();
  const res = await fetch(apiBase + path, opts);
  if (res.status === 401) {
    clearToken();
    throw new Error('unauthorized');
  }
  return res.json();
}

document.addEventListener('DOMContentLoaded', () => {
  const btnAuth = id('btnAuth'),
    authModal = id('authModal'),
    closeAuth = id('closeAuth'),
    authForm = id('authForm'),
    switchAuth = id('switchAuth'),
    authTitle = id('authTitle');

  const appMain = id('app'),
    materials = id('materials'),
    aiArea = id('aiArea'),
    chatBox = id('chatBox'),
    adminPanel = id('adminPanel'),
    uploadForm = id('uploadForm');

  let isLogin = true;

  btnAuth.addEventListener('click', () => authModal.classList.remove('hidden'));
  closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));

  switchAuth.addEventListener('click', () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? 'Login' : 'Register';
    id('u_name').style.display = isLogin ? 'none' : 'block';
    authForm.querySelector('button').innerText = isLogin ? 'Login' : 'Register';
    switchAuth.innerText = isLogin ? "Don't have an account? Register" : 'Already have an account? Login';
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = id('u_name').value || 'user';
    const email = id('u_email').value;
    const password = id('u_password').value;
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin ? { email, password } : { username, email, password };

    try {
      const res = await fetch(apiBase + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const j = await res.json();
      if (res.ok) {
        if (isLogin) {
          setToken(j.token);
          authModal.classList.add('hidden');
          init();
        } else {
          alert('Registered. Please log in.');
          switchAuth.click();
        }
      } else {
        alert(j.error || j.message || 'Error');
      }
    } catch (e) {
      console.error(e);
      alert('Auth error');
    }
  });

  async function init() {
    if (!token()) return;
    appMain.removeAttribute('aria-hidden');
    try {
      const contents = await api('/api/contents');
      materials.innerHTML = '<h3>Materials</h3>';
      contents.forEach(c => {
        const d = document.createElement('div');
        d.innerHTML = `<strong>${c.title}</strong><p>${c.description || ''}</p>`;
        materials.appendChild(d);
      });
      const payload = JSON.parse(atob(token().split('.')[1]));
      if (payload.role === 'admin') adminPanel.classList.remove('hidden');
      aiArea.classList.remove('hidden');
    } catch (e) {
      console.error(e);
    }
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('file', id('file').files[0]);
    form.append('title', id('title').value);
    form.append('description', id('desc').value);
    form.append('type', id('type').value);
    form.append('premium', id('isPremium').checked ? 'true' : 'false');

    try {
      const res = await fetch(apiBase + '/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token() },
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

  if (token()) init();
});
