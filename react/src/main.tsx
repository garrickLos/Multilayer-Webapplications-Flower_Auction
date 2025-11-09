// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App'
import Hoofdscherm from "./Hoofdscherm.tsx";
import SellerScreenAdd from "./SellerScreenAdd.tsx";
import './css/SellerScreenAdd.css';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HashRouter>
            <SellerScreenAdd />
        </HashRouter>
    </React.StrictMode>
)
