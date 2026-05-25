/**
 * Login / Sign up page module
 */
import { api } from './api.js';
import { clearSession, isLoggedIn, setSession } from './storage.js';

const signinPanel = document.getElementById('signin-panel');
const signupPanel = document.getElementById('signup-panel');
const forgotPanel = document.getElementById('forgot-panel');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');
const signinError = document.getElementById('auth-error');
const signupError = document.getElementById('signup-error');
const forgotError = document.getElementById('forgot-error');

function showPanel(panel, keepSigninMessage = false) {
    const isSignup = panel === 'signup';
    const isForgot = panel === 'forgot';
    signupPanel.hidden = !isSignup;
    signinPanel.hidden = isSignup || isForgot;
    if (forgotPanel) forgotPanel.hidden = !isForgot;
    document.title = isSignup
        ? 'Sign Up | HomeSecure'
        : isForgot
          ? 'Reset Password | HomeSecure'
          : 'Sign In | HomeSecure';
    if (!keepSigninMessage) hideErrors();
}

function showError(el, message) {
    el.textContent = message;
    el.className = 'auth-error';
    el.hidden = false;
}

function showSuccess(el, message) {
    el.textContent = message;
    el.className = 'auth-success';
    el.hidden = false;
}

function hideErrors() {
    [signinError, signupError, forgotError].forEach((el) => {
        if (!el) return;
        el.hidden = true;
        el.className = 'auth-error';
    });
}

document.getElementById('show-signup-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPanel('signup');
});

document.getElementById('show-login-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPanel('signin');
});

document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
    });
});

async function redirectIfAuthenticated() {
    if (!isLoggedIn()) return;
    try {
        await api.getMe();
        window.location.href = '/';
    } catch {
        /* invalid token — stay on login */
    }
}

signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrors();
    const submit = document.getElementById('signin-submit');
    submit.disabled = true;
    submit.textContent = 'Signing in...';

    try {
        const email = signinForm.email.value.trim();
        const password = signinForm.password.value;
        const data = await api.login(email, password);
        setSession(data.token, data.user);
        window.location.href = '/';
    } catch (err) {
        showError(signinError, err.message || 'Invalid email or password');
    } finally {
        submit.disabled = false;
        submit.textContent = 'Log In';
    }
});

document.getElementById('forgot-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPanel('forgot');
});

document.getElementById('back-to-login-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPanel('signin');
});

forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrors();

    const email = forgotForm.email.value.trim();
    const password = forgotForm.password.value;
    const confirm = forgotForm.confirmPassword.value;

    if (password !== confirm) {
        showError(forgotError, 'Passwords do not match.');
        return;
    }

    const submit = document.getElementById('forgot-submit');
    submit.disabled = true;
    submit.textContent = 'Resetting...';

    try {
        const data = await api.resetPassword(email, password);
        forgotForm.reset();
        showPanel('signin', true);
        signinForm.email.value = email;
        showSuccess(
            signinError,
            data.message || 'Password reset. Log in with your new password.'
        );
    } catch (err) {
        showError(forgotError, err.message || 'Could not reset password');
    } finally {
        submit.disabled = false;
        submit.textContent = 'Reset Password';
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrors();
    const submit = document.getElementById('signup-submit');
    submit.disabled = true;
    submit.textContent = 'Creating account...';

    try {
        const name = signupForm.name.value.trim();
        const email = signupForm.email.value.trim();
        const password = signupForm.password.value;
        await api.signup(name, email, password);
        clearSession();
        signupForm.reset();
        showPanel('signin', true);
        signinForm.email.value = email;
        showSuccess(
            signinError,
            'Account created! Please proceed to log in to access your homepage.'
        );
    } catch (err) {
        showError(signupError, err.message || 'Could not create account');
    } finally {
        submit.disabled = false;
        submit.textContent = 'Sign Up';
    }
});

redirectIfAuthenticated();
