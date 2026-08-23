import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App.tsx';
import { WebStorageSkillBoardAdapter } from './persistence/webStorageSkillBoardAdapter';
import { createAppStore } from './store/store';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element was not found');
}

const persistence = new WebStorageSkillBoardAdapter('skillboard-hunter:mvp0');
const store = createAppStore(persistence);

createRoot(rootElement).render(
    <StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>,
);
