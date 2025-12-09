"use client";

const STORAGE_KEY = 'base_cartel_god_mode';

export function isGodModeEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setGodMode(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, String(enabled));
    // Dispatch a custom event so components can react immediately if needed
    window.dispatchEvent(new Event('god-mode-change'));
}
