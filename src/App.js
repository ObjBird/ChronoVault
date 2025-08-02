import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CreateSealPage from './pages/CreateSealPage';
import VaultPage from './pages/VaultPage';
import SealDetailPage from './pages/SealDetailPage';
import { Web3Provider } from './context/Web3Context';

function App() {
    return (
        <Web3Provider>
            <div className="app">
                <AnimatePresence mode="wait">
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<HomePage />} />
                            <Route path="/create" element={<CreateSealPage />} />
                            <Route path="/vault" element={<VaultPage />} />
                            <Route path="/seal/:id" element={<SealDetailPage />} />
                        </Route>
                    </Routes>
                </AnimatePresence>
            </div>
        </Web3Provider>
    );
}

export default App; 