import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import './app.css';
import { locale } from './lib/i18n.svelte';
import { requestPersistence } from './lib/store.svelte';

document.documentElement.lang = locale.lang;
requestPersistence();
registerSW({ immediate: true });

mount(App, { target: document.getElementById('app')! });
