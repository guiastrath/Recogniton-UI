import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import MainPage from './domains/mainPage/MainPage.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MainPage />
    </StrictMode>,
)
