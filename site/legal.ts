import './style.css';

const banner = document.getElementById('offline-banner');
const updateConnection = () => { if (banner) banner.hidden = navigator.onLine; };
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
