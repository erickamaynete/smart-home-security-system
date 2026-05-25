/**
 * Account Security — change password
 */
import { api } from './api.js';
import { showToast } from './app.js';

export function initAccountSecurity() {
    const modal = document.getElementById('change-password-modal');
    const form = document.getElementById('change-password-form');
    const errorEl = document.getElementById('change-password-error');
    const openBtn = document.getElementById('open-change-password');

    if (!modal || !form || !openBtn) return;

    const openModal = () => {
        form.reset();
        hideError();
        modal.hidden = false;
        form.querySelector('input')?.focus();
    };

    const closeModal = () => {
        modal.hidden = true;
        form.reset();
        hideError();
    };

    const hideError = () => {
        if (errorEl) {
            errorEl.hidden = true;
            errorEl.textContent = '';
        }
    };

    const showError = (message) => {
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.hidden = false;
    };

    openBtn.addEventListener('click', openModal);
    document.getElementById('close-change-password')?.addEventListener('click', closeModal);
    modal.querySelectorAll('[data-close-password-modal]').forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            showError('New passwords do not match.');
            return;
        }

        if (newPassword === currentPassword) {
            showError('New password must be different from your current password.');
            return;
        }

        const submit = document.getElementById('change-password-submit');
        submit.disabled = true;
        submit.textContent = 'Updating...';

        try {
            const data = await api.changePassword(currentPassword, newPassword);
            closeModal();
            showToast(data.message || 'Password updated successfully', 'success');
        } catch (err) {
            showError(err.message || 'Could not update password');
        } finally {
            submit.disabled = false;
            submit.textContent = 'Update Password';
        }
    });
}
