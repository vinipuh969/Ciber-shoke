function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 3 + 1;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = Math.random() * 12 + 5 + 's';
    particle.style.animationDelay = Math.random() * 8 + 's';
    particle.style.opacity = Math.random() * 0.4 + 0.1;
    container.appendChild(particle);
  }
}
setTimeout(createParticles, 100);

let currentUser = null;
let users = [];
let computers = [];
let adminRevenue = 18500;
let nextUserId = 1;
let activeTimers = new Map();
let userSettings = {
  animations: true,
  notifications: true,
  desktopAlerts: true,
  compactMode: false,
  showPcLabels: true
};

function toggleSidebar(show) {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 480) {
    if (show) sidebar.classList.add('visible');
    else sidebar.classList.remove('visible');
  } else {
    if (show) sidebar.style.transform = 'translateX(0)';
    else sidebar.style.transform = 'translateX(-100%)';
  }
}

function loadData() {
  const savedUsers = localStorage.getItem('cyberclub_users');
  if (savedUsers) {
    users = JSON.parse(savedUsers);
    nextUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  } else {
    users = [
      { id: 1, name: "Admin", email: "admin@club.ru", password: "1488", balance: 5000, hours: 120, status: "VIP", isAdmin: true, closedProfile: false, language: 'ru', theme: 'dark', settings: { ...userSettings } },
      { id: 2, name: "Игрок", email: "player@mail.ru", password: "123", balance: 2000, hours: 25, status: "Normal", isAdmin: false, closedProfile: false, language: 'ru', theme: 'dark', settings: { ...userSettings } }
    ];
    nextUserId = 3;
  }
  
  const savedComputers = localStorage.getItem('cyberclub_computers_29');
  if (savedComputers) {
    computers = JSON.parse(savedComputers);
  } else {
    computers = [];
    for (let i = 1; i <= 29; i++) {
      let initStatus = 'free', initTimeLeft = 0, initCurrentUser = null;
      if (i === 3 || i === 8 || i === 14) { initStatus = 'occupied'; initTimeLeft = 45; initCurrentUser = 2; }
      else if (i === 19 || i === 25) { initStatus = 'occupied'; initTimeLeft = 120; initCurrentUser = 1; }
      computers.push({ id: i, status: initStatus, currentUser: initCurrentUser, timeLeft: initTimeLeft });
    }
  }
  
  const savedRevenue = localStorage.getItem('cyberclub_revenue');
  if (savedRevenue) adminRevenue = parseInt(savedRevenue);
}

function saveData() {
  localStorage.setItem('cyberclub_users', JSON.stringify(users));
  localStorage.setItem('cyberclub_computers_29', JSON.stringify(computers));
  localStorage.setItem('cyberclub_revenue', adminRevenue);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function applyTheme(theme) {
  document.body.classList.remove('dark-theme', 'light-theme');
  document.body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
}

function stopTimerForPC(pcId) {
  if (activeTimers.has(pcId)) {
    clearInterval(activeTimers.get(pcId));
    activeTimers.delete(pcId);
  }
}

function startTimerForPC(pcId) {
  stopTimerForPC(pcId);
  const interval = setInterval(() => {
    const pc = computers.find(p => p.id === pcId);
    if (pc && pc.status === 'occupied' && pc.timeLeft > 0) {
      pc.timeLeft--;
      if (pc.timeLeft <= 0) {
        pc.status = 'free';
        pc.currentUser = null;
        pc.timeLeft = 0;
        saveData();
        if (!document.getElementById('hallBlock').classList.contains('hidden')) renderHall();
        clearInterval(interval);
        activeTimers.delete(pcId);
        if (currentUser && currentUser.settings && currentUser.settings.desktopAlerts && !document.getElementById('hallBlock').classList.contains('hidden')) {
          showToast((pcId >= 26 ? 'PS' : 'ПК') + ' ' + pcId + ' освободился!');
        }
      } else {
        if (!document.getElementById('hallBlock').classList.contains('hidden')) renderHall();
      }
    } else {
      clearInterval(interval);
      activeTimers.delete(pcId);
    }
  }, 1000);
  activeTimers.set(pcId, interval);
}

function initAllTimers() {
  computers.forEach(pc => {
    if (pc.status === 'occupied' && pc.timeLeft > 0) startTimerForPC(pc.id);
  });
}

function updateUI() {
  if (currentUser) {
    document.getElementById('displayUsername').innerText = currentUser.name;
    document.getElementById('balanceAmount').innerText = currentUser.balance;
    document.getElementById('balanceBar').style.width = Math.min(100, (currentUser.balance / 5000) * 100) + '%';
    
    if (!document.getElementById('profileBlock').classList.contains('hidden')) {
      document.getElementById('profileName').innerText = currentUser.name;
      document.getElementById('profileEmail').innerText = currentUser.email;
      document.getElementById('profileBalance').innerText = currentUser.balance + ' ₽';
      document.getElementById('profileStatus').innerText = currentUser.status;
      document.getElementById('profileHours').innerText = currentUser.hours;
    }
    if (!document.getElementById('depositBlock').classList.contains('hidden')) {
      document.getElementById('depositCurrentBalance').innerHTML = currentUser.balance + ' ₽';
    }
    
    const tTheme = document.getElementById('modalThemeStatus');
    const tAnim = document.getElementById('modalAnimationStatus');
    const tCompact = document.getElementById('modalCompactStatus');
    const tLabels = document.getElementById('modalLabelsStatus');
    const tNotif = document.getElementById('modalNotificationsStatus');
    
    if (tTheme) tTheme.innerHTML = currentUser.theme === 'dark' ? 'Тёмная' : 'Светлая';
    if (tAnim) tAnim.innerHTML = currentUser.settings?.animations ? 'Вкл' : 'Выкл';
    if (tCompact) tCompact.innerHTML = currentUser.settings?.compactMode ? 'Вкл' : 'Выкл';
    if (tLabels) tLabels.innerHTML = currentUser.settings?.showPcLabels ? 'Вкл' : 'Выкл';
    if (tNotif) tNotif.innerHTML = currentUser.settings?.desktopAlerts ? 'Вкл' : 'Выкл';
    
    applyTheme(currentUser.theme);
  }
}

function showSection(section) {
  if (!currentUser && section !== 'login' && section !== 'register') {
    showLoginForm();
    return;
  }
  if (currentUser) toggleSidebar(true);
  
  ['loginBlock', 'registerBlock', 'hallBlock', 'tariffsBlock', 'profileBlock', 'depositBlock'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  
  if (section === 'hall') {
    document.getElementById('hallBlock').classList.remove('hidden');
    renderHall();
  } else if (section === 'tariffs') {
    document.getElementById('tariffsBlock').classList.remove('hidden');
  } else if (section === 'profile') {
    document.getElementById('profileBlock').classList.remove('hidden');
    updateUI();
  } else if (section === 'deposit') {
    document.getElementById('depositBlock').classList.remove('hidden');
    if (currentUser) updateUI();
  }
}

function showLoginForm() {
  toggleSidebar(false);
  document.getElementById('loginBlock').classList.remove('hidden');
  document.getElementById('registerBlock').classList.add('hidden');
  document.getElementById('hallBlock').classList.add('hidden');
  document.getElementById('tariffsBlock').classList.add('hidden');
  document.getElementById('profileBlock').classList.add('hidden');
  document.getElementById('depositBlock').classList.add('hidden');
  closeSettingsModal();
}

function showNewRegisterForm() {
  toggleSidebar(false);
  document.getElementById('registerBlock').classList.remove('hidden');
  document.getElementById('loginBlock').classList.add('hidden');
  closeSettingsModal();
}

function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const user = users.find(u => (u.email === email || u.name === email) && u.password === pass);
  
  if (user) {
    if (!user.settings) user.settings = { ...userSettings };
    currentUser = user;
    saveData();
    updateUI();
    toggleSidebar(true);
    showSection('hall');
    showToast('Добро пожаловать, ' + user.name + '!');
  } else {
    showToast('Неверный логин или пароль');
  }
}

function checkPasswordStrength() {
  const pass = document.getElementById('regPass').value;
  const bar = document.getElementById('passStrengthBar');
  const text = document.getElementById('passStrengthText');
  let strength = 0;
  if (pass.length >= 4) strength = 1;
  if (pass.length >= 6) strength = 2;
  if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) strength = 3;
  if (pass.length >= 10 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) strength = 4;
  
  const widths = ['0%', '25%', '50%', '75%', '100%'];
  const texts = ['—', 'Слабый', 'Средний', 'Хороший', 'Отличный'];
  
  bar.style.width = widths[strength];
  text.innerHTML = 'Сложность: ' + texts[strength];
}

function registerNew() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  
  let isValid = true;
  let errorMessage = '';
  
  if (name.length < 2) {
    isValid = false;
    errorMessage = 'Имя должно содержать минимум 2 символа';
  } else if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) {
    isValid = false;
    errorMessage = 'Неверный email';
  } else if (pass.length < 4) {
    isValid = false;
    errorMessage = 'Пароль должен содержать минимум 4 символа';
  } else if (pass !== pass2) {
    isValid = false;
    errorMessage = 'Пароли не совпадают';
  }
  
  if (!isValid) {
    showToast(errorMessage);
    return;
  }
  
  if (users.find(u => u.email === email)) {
    showToast('Email уже зарегистрирован!');
    return;
  }
  
  const newUser = {
    id: nextUserId++,
    name, email,
    password: pass,
    balance: 500,
    hours: 0,
    status: 'Normal',
    isAdmin: false,
    closedProfile: false,
    language: 'ru',
    theme: 'dark',
    settings: { ...userSettings }
  };
  users.push(newUser);
  saveData();
  showToast('Регистрация успешна!');
  setTimeout(() => showLoginForm(), 1200);
}

function logout() {
  currentUser = null;
  toggleSidebar(false);
  showLoginForm();
  updateUI();
  closeSettingsModal();
  showToast('До свидания!');
}

function addDeposit(amount) {
  if (!currentUser) { alert('Сначала войдите!'); return; }
  currentUser.balance += amount;
  adminRevenue += amount;
  saveData();
  updateUI();
  if (currentUser.settings?.notifications) showToast('+' + amount + ' ₽');
  if (!document.getElementById('depositBlock').classList.contains('hidden')) {
    document.getElementById('depositCurrentBalance').innerHTML = currentUser.balance + ' ₽';
  }
}

function addCustomDeposit() {
  if (!currentUser) { alert('Сначала войдите!'); return; }
  const amount = parseInt(document.getElementById('customDepositAmount').value);
  if (isNaN(amount) || amount <= 0) { alert('Введите сумму от 1 ₽'); return; }
  addDeposit(amount);
  document.getElementById('customDepositAmount').value = '';
}

function openSettingsModal() {
  if (!currentUser) { alert('Сначала войдите в аккаунт!'); return; }
  updateUI();
  document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.add('hidden');
}

function toggleTheme() {
  if (!currentUser) return;
  currentUser.theme = currentUser.theme === 'dark' ? 'light' : 'dark';
  if (currentUser.settings?.animations) document.querySelector('.settings-item')?.classList.add('effect-pulse');
  setTimeout(() => document.querySelector('.settings-item')?.classList.remove('effect-pulse'), 300);
  updateUI();
  saveData();
}

function toggleAnimationEffect() {
  if (currentUser) {
    currentUser.settings.animations = !currentUser.settings.animations;
    updateUI();
    saveData();
  }
}

function toggleDesktopAlerts() {
  if (currentUser) {
    currentUser.settings.desktopAlerts = !currentUser.settings.desktopAlerts;
    updateUI();
    saveData();
  }
}

function toggleCompactMode() {
  if (currentUser) {
    currentUser.settings.compactMode = !currentUser.settings.compactMode;
    updateUI();
    renderHall();
    saveData();
  }
}

function togglePcLabels() {
  if (currentUser) {
    currentUser.settings.showPcLabels = !currentUser.settings.showPcLabels;
    updateUI();
    renderHall();
    saveData();
  }
}

function resetUserSettings() {
  if (currentUser) {
    currentUser.settings = { ...userSettings };
    currentUser.theme = 'dark';
    updateUI();
    renderHall();
    saveData();
    showToast('Настройки сброшены!');
  }
}

function renderHall() {
  const container = document.getElementById('pcGridContainer');
  if (!container) return;
  container.innerHTML = '';
  const isCompact = currentUser?.settings?.compactMode || false;
  const showLabels = currentUser?.settings?.showPcLabels !== false;
  const rows = [
    { name: "Ряд 1", type: "Normal", count: 5, isPS: false },
    { name: "Ряд 2", type: "Normal", count: 5, isPS: false },
    { name: "Ряд 3", type: "Normal+", count: 5, isPS: false },
    { name: "Ряд 4", type: "Normal++", count: 5, isPS: false },
    { name: "Ряд 5", type: "VIP", count: 5, isPS: false },
    { name: "Ряд 6", type: "PS", count: 4, isPS: true }
  ];
  let idx = 0;
  
  rows.forEach((row, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'pc-row';
    if (isCompact) rowDiv.style.gap = '6px';
    if (rowIndex < rows.length - 1) rowDiv.style.marginBottom = '8px';
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'row-label';
    labelDiv.innerHTML = '<span class="row-badge">' + row.name + '</span><span class="type-tag">' + row.type + '</span><span style="font-size:10px;">' + row.count + '</span>';
    rowDiv.appendChild(labelDiv);
    
    for (let i = 0; i < row.count && idx < computers.length; i++) {
      const pc = computers[idx];
      const card = document.createElement('div');
      card.className = 'pc-card';
      if (isCompact) card.style.padding = '8px 3px';
      
      let timer = '';
      if (pc.status === 'occupied' && pc.timeLeft > 0) {
        let m = Math.floor(pc.timeLeft / 60), s = pc.timeLeft % 60;
        timer = '<div class="pc-timer">' + m + ':' + s.toString().padStart(2, '0') + '</div>';
      }
      
      const devLabel = row.isPS ? 'PS' : 'ПК';
      const labelText = showLabels ? devLabel + ' ' + pc.id : pc.id;
      card.innerHTML = '<div class="pc-number">' + labelText + '</div><div class="pc-status ' + (pc.status === 'free' ? 'status-free' : 'status-occupied') + '">' + (pc.status === 'free' ? 'Свободен' : 'Занят') + '</div>' + timer;
      
      if (pc.status === 'free' && currentUser && currentUser.balance >= 100) {
        card.style.cursor = 'pointer';
        card.onclick = () => rentPC(pc.id, row.isPS);
      } else if (pc.status === 'free' && (!currentUser || currentUser.balance < 100)) {
        card.style.opacity = '0.4';
        card.title = 'Недостаточно средств';
      } else {
        card.onclick = () => {
          if (currentUser?.settings?.desktopAlerts) showToast(devLabel + ' ' + pc.id + ' занят');
        };
      }
      rowDiv.appendChild(card);
      idx++;
    }
    container.appendChild(rowDiv);
  });
}

function rentPC(pcId, isPS) {
  if (!currentUser) { alert('Сначала войдите!'); return; }
  if (currentUser.balance < 100) { alert('Недостаточно средств!'); return; }
  const pc = computers.find(p => p.id === pcId);
  if (pc && pc.status === 'free') {
    const deviceName = isPS ? 'PS' : 'ПК';
    if (confirm('Арендовать ' + deviceName + ' ' + pcId + ' на 1 час за 100 ₽?')) {
      currentUser.balance -= 100;
      adminRevenue += 100;
      pc.status = 'occupied';
      pc.currentUser = currentUser.id;
      pc.timeLeft = 3600;
      currentUser.hours += 1;
      saveData();
      updateUI();
      renderHall();
      startTimerForPC(pcId);
      if (currentUser.settings.notifications) showToast(deviceName + ' ' + pcId + ' арендован!');
    }
  }
}

function refreshHall() { renderHall(); }

loadData();
showLoginForm();

function setupEnterKeyHandler() {
  const le = document.getElementById('loginEmail');
  const lp = document.getElementById('loginPass');
  const fn = (e) => { if (e.key === 'Enter') { e.preventDefault(); login(); } };
  if (le) le.addEventListener('keypress', fn);
  if (lp) lp.addEventListener('keypress', fn);
}
setupEnterKeyHandler();
initAllTimers();

document.getElementById('regPass').addEventListener('input', checkPasswordStrength);

window.addEventListener('resize', () => {
  if (window.innerWidth > 480 && currentUser) {
    document.getElementById('sidebar').style.transform = '';
  }
});

document.addEventListener('click', function(e) {
  const modal = document.getElementById('settingsModal');
  if (e.target === modal) closeSettingsModal();
});
