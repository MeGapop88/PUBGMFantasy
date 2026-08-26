/**
 * LOGIN PAGE
 * Designed with Stitch Ignite "Tactical Protocol" HUD aesthetic
 */
import { loginUser, registerUser, getSession } from '../state.js';
import { toast, renderPage } from '../ui.js';

export function renderLogin(router) {
  if (getSession()) { router.navigate('/dashboard'); return; }

  renderPage(`
    <div class="min-h-[85vh] flex items-center justify-center py-12 px-4 relative">
      <div class="hud-card w-full max-w-md p-8 md:p-10 border border-outline-variant relative overflow-hidden bg-[#1A1A1C]">
        
        <!-- Top Accent Bar -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(255,107,0,0.6)]"></div>

        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 border border-primary/40 bg-primary/10 text-primary mb-3">
            <span class="material-symbols-outlined text-3xl">sports_esports</span>
          </div>
          <h1 class="font-headline font-bold text-3xl tracking-tighter uppercase text-on-surface">TACTICAL PROTOCOL</h1>
          <p class="font-label text-xs text-outline tracking-widest uppercase mt-1">PMGO COMPETITIVE INTEL PORTAL</p>
        </div>

        <div class="flex border-b border-outline-variant mb-6">
          <button id="tab-login" class="flex-1 py-3 font-headline font-bold text-sm uppercase tracking-wider text-primary border-b-2 border-primary transition-colors">AUTHENTICATE</button>
          <button id="tab-register" class="flex-1 py-3 font-headline font-bold text-sm uppercase tracking-wider text-outline border-b-2 border-transparent hover:text-on-surface transition-colors">REGISTER</button>
        </div>

        <!-- Login Form -->
        <form id="form-login" class="flex flex-col gap-5">
          <div>
            <label class="block font-label text-xs font-bold uppercase tracking-wider text-outline mb-2">OPERATIVE CALLSIGN</label>
            <input id="login-username" type="text" placeholder="Enter username..." class="w-full bg-[#0E0E0F] border border-outline-variant px-4 py-3 text-on-surface font-body text-sm focus:border-primary focus:outline-none transition-colors" required />
          </div>
          <div>
            <label class="block font-label text-xs font-bold uppercase tracking-wider text-outline mb-2">SECURITY CLEARANCE KEY</label>
            <input id="login-password" type="password" placeholder="••••••••" class="w-full bg-[#0E0E0F] border border-outline-variant px-4 py-3 text-on-surface font-body text-sm focus:border-primary focus:outline-none transition-colors" required />
          </div>
          <div id="login-error" class="hidden p-3 border border-red-500/40 bg-red-500/10 text-red-400 font-label text-xs"></div>
          <button type="submit" class="btn-primary w-full py-3.5 mt-2 font-headline font-bold text-base uppercase tracking-widest flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">vpn_key</span> ACCESS TERMINAL
          </button>
        </form>

        <!-- Register Form -->
        <form id="form-register" class="hidden flex flex-col gap-5">
          <div>
            <label class="block font-label text-xs font-bold uppercase tracking-wider text-outline mb-2">NEW CALLSIGN</label>
            <input id="reg-username" type="text" placeholder="Choose username..." class="w-full bg-[#0E0E0F] border border-outline-variant px-4 py-3 text-on-surface font-body text-sm focus:border-primary focus:outline-none transition-colors" required />
          </div>
          <div>
            <label class="block font-label text-xs font-bold uppercase tracking-wider text-outline mb-2">SECURITY CLEARANCE KEY</label>
            <input id="reg-password" type="password" placeholder="••••••••" class="w-full bg-[#0E0E0F] border border-outline-variant px-4 py-3 text-on-surface font-body text-sm focus:border-primary focus:outline-none transition-colors" required />
          </div>
          <div>
            <label class="block font-label text-xs font-bold uppercase tracking-wider text-outline mb-2">CONFIRM SECURITY KEY</label>
            <input id="reg-password2" type="password" placeholder="••••••••" class="w-full bg-[#0E0E0F] border border-outline-variant px-4 py-3 text-on-surface font-body text-sm focus:border-primary focus:outline-none transition-colors" required />
          </div>
          <div id="reg-error" class="hidden p-3 border border-red-500/40 bg-red-500/10 text-red-400 font-label text-xs"></div>
          <button type="submit" class="btn-primary w-full py-3.5 mt-2 font-headline font-bold text-base uppercase tracking-widest flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">person_add</span> INITIALIZE ACCOUNT
          </button>
        </form>

      </div>
    </div>
  `);

  const tabLogin    = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin   = document.getElementById('form-login');
  const formReg     = document.getElementById('form-register');

  tabLogin.onclick = () => {
    tabLogin.classList.add('text-primary', 'border-primary');
    tabLogin.classList.remove('text-outline', 'border-transparent');
    tabRegister.classList.remove('text-primary', 'border-primary');
    tabRegister.classList.add('text-outline', 'border-transparent');
    formLogin.classList.remove('hidden');
    formReg.classList.add('hidden');
  };

  tabRegister.onclick = () => {
    tabRegister.classList.add('text-primary', 'border-primary');
    tabRegister.classList.remove('text-outline', 'border-transparent');
    tabLogin.classList.remove('text-primary', 'border-primary');
    tabLogin.classList.add('text-outline', 'border-transparent');
    formReg.classList.remove('hidden');
    formLogin.classList.add('hidden');
  };

  formLogin.onsubmit = e => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    try {
      loginUser(
        document.getElementById('login-username').value,
        document.getElementById('login-password').value
      );
      router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  };

  formReg.onsubmit = e => {
    e.preventDefault();
    const errEl = document.getElementById('reg-error');
    errEl.classList.add('hidden');
    const pw  = document.getElementById('reg-password').value;
    const pw2 = document.getElementById('reg-password2').value;
    if (pw !== pw2) {
      errEl.textContent = 'Security keys do not match';
      errEl.classList.remove('hidden');
      return;
    }
    try {
      registerUser(document.getElementById('reg-username').value, pw);
      loginUser(document.getElementById('reg-username').value, pw);
      toast('Operative clearance registered. Welcome.', 'success');
      router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  };
}
