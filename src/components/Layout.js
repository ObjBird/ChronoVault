import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Archive, Plus, Wallet, LogOut } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

const Layout = () => {
  const location = useLocation();
  const { account, isConnected, connectWallet, disconnectWallet, isConnecting } = useWeb3();
  const [particles, setParticles] = useState([]);

  // Generate background particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 20,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="layout">
      {/* Animated background particles */}
      <div className="particles">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
            }}
            animate={{
              y: [0, -window.innerHeight - 100],
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="nav">
        <motion.div
          className="nav-container"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Link to="/" className="logo">
            <motion.div
              className="logo-icon"
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Clock size={32} />
            </motion.div>
            <span className="logo-text gradient-text-primary">ChronoVault</span>
          </Link>

          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              <Clock size={20} />
              首页
            </Link>
            <Link
              to="/create"
              className={`nav-link ${location.pathname === '/create' ? 'active' : ''}`}
            >
              <Plus size={20} />
              创建封印
            </Link>
            <Link
              to="/vault"
              className={`nav-link ${location.pathname === '/vault' ? 'active' : ''}`}
            >
              <Archive size={20} />
              我的金库
            </Link>
          </div>

          <div className="wallet-section">
            {isConnected ? (
              <div className="wallet-connected">
                <div className="wallet-address">
                  <Wallet size={16} />
                  {formatAddress(account)}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="btn btn-secondary disconnect-btn"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn btn-primary connect-wallet-btn"
              >
                {isConnecting ? (
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  <>
                    <Wallet size={16} />
                    连接钱包
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          position: relative;
        }

        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(15, 15, 35, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: white;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }

        .nav-links {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .nav-link.active {
          color: white;
          background: rgba(102, 126, 234, 0.2);
          border: 1px solid rgba(102, 126, 234, 0.3);
        }

        .wallet-section {
          display: flex;
          align-items: center;
        }

        .wallet-connected {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wallet-address {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }

        .disconnect-btn {
          padding: 8px;
          min-width: auto;
        }

        .connect-wallet-btn {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .main-content {
          padding-top: 80px;
          min-height: calc(100vh - 80px);
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0 16px;
            flex-wrap: wrap;
            height: auto;
            min-height: 80px;
          }

          .nav-links {
            gap: 16px;
            order: 3;
            width: 100%;
            justify-content: center;
            padding: 16px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .logo {
            order: 1;
          }

          .wallet-section {
            order: 2;
          }

          .main-content {
            padding-top: 140px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout; 