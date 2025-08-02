import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Shield, Infinity, Sparkles, ArrowRight, Play } from 'lucide-react';

const HomePage = () => {
    const features = [
        {
            icon: Clock,
            title: '时间锁定',
            description: '设定未来的解锁时间，让记忆在时间的长河中静待开启',
            color: 'from-blue-500 to-purple-600'
        },
        {
            icon: Shield,
            title: '链上存储',
            description: '基于Monad区块链的不可篡改存储，确保您的记忆永远安全',
            color: 'from-purple-500 to-pink-600'
        },
        {
            icon: Infinity,
            title: '永恒保存',
            description: '去中心化存储确保您的记忆跨越时间，永不消失',
            color: 'from-pink-500 to-red-600'
        },
        {
            icon: Sparkles,
            title: '情感封印',
            description: '不仅存储文字图像，更能封存那一刻的情感与心境',
            color: 'from-yellow-500 to-orange-600'
        }
    ];

    return (
        <div className="homepage">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="hero-text"
                    >
                        <h1 className="hero-title">
                            <span className="gradient-text-primary">ChronoVault</span>
                            <br />
                            时间性记忆封印系统
                        </h1>
                        <p className="hero-description">
                            将珍贵的记忆、情感和想法封存在时间的胶囊中，通过区块链技术确保其永恒不变，
                            在未来的某个时刻为你或世界重新开启这扇记忆之门。
                        </p>
                        <div className="hero-buttons">
                            <Link to="/create" className="btn btn-primary hero-btn">
                                <Play size={20} />
                                开始创建封印
                                <ArrowRight size={20} />
                            </Link>
                            <Link to="/vault" className="btn btn-secondary hero-btn">
                                <Clock size={20} />
                                查看我的金库
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        className="hero-visual"
                    >
                        <div className="time-capsule">
                            <motion.div
                                className="capsule-core"
                                animate={{
                                    rotate: 360,
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{
                                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                }}
                            >
                                <div className="capsule-ring ring-1" />
                                <div className="capsule-ring ring-2" />
                                <div className="capsule-ring ring-3" />
                                <div className="capsule-center">
                                    <Clock size={48} />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="section-header"
                    >
                        <h2 className="section-title gradient-text">核心特性</h2>
                        <p className="section-subtitle">
                            先进的区块链技术与时间艺术的完美结合
                        </p>
                    </motion.div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10, scale: 1.02 }}
                                className="feature-card"
                            >
                                <div className={`feature-icon bg-gradient-to-br ${feature.color}`}>
                                    <feature.icon size={32} />
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="section-header"
                    >
                        <h2 className="section-title gradient-text">工作原理</h2>
                        <p className="section-subtitle">
                            三步完成您的时间记忆封印
                        </p>
                    </motion.div>

                    <div className="steps">
                        {[
                            {
                                step: '01',
                                title: '创建封印',
                                description: '选择要封存的内容：文字、图片、音频或视频，设定解锁时间'
                            },
                            {
                                step: '02',
                                title: '区块链存储',
                                description: '内容通过加密技术存储在Monad区块链上，确保不可篡改'
                            },
                            {
                                step: '03',
                                title: '时间解锁',
                                description: '到达设定时间后，封印自动解锁，记忆重新与世界相遇'
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="step-card"
                            >
                                <div className="step-number">{item.step}</div>
                                <div className="step-content">
                                    <h3 className="step-title">{item.title}</h3>
                                    <p className="step-description">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <style jsx>{`
        .homepage {
          min-height: 100vh;
        }

        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
          position: relative;
          overflow: hidden;
        }

        .hero-content {
          max-width: 1200px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
          font-family: 'JetBrains Mono', monospace;
        }

        .hero-description {
          font-size: 1.25rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 40px;
        }

        .hero-buttons {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .time-capsule {
          position: relative;
          width: 400px;
          height: 400px;
        }

        .capsule-core {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .capsule-ring {
          position: absolute;
          border: 2px solid;
          border-radius: 50%;
          opacity: 0.6;
        }

        .ring-1 {
          width: 100%;
          height: 100%;
          border-color: #667eea;
          animation: pulse 3s ease-in-out infinite;
        }

        .ring-2 {
          width: 80%;
          height: 80%;
          border-color: #764ba2;
          animation: pulse 3s ease-in-out infinite 1s;
        }

        .ring-3 {
          width: 60%;
          height: 60%;
          border-color: #f093fb;
          animation: pulse 3s ease-in-out infinite 2s;
        }

        .capsule-center {
          position: relative;
          z-index: 10;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        .features, .how-it-works {
          padding: 120px 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-title {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 16px;
          font-family: 'JetBrains Mono', monospace;
        }

        .section-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px 32px;
          text-align: center;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }

        .feature-icon {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: white;
        }

        .feature-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: white;
        }

        .feature-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        .steps {
          display: flex;
          flex-direction: column;
          gap: 40px;
          max-width: 800px;
          margin: 0 auto;
        }

        .step-card {
          display: flex;
          align-items: center;
          gap: 40px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .step-number {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'JetBrains Mono', monospace;
          min-width: 100px;
        }

        .step-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 12px;
          color: white;
        }

        .step-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        @media (max-width: 1024px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 60px;
            text-align: center;
          }
          
          .hero-title {
            font-size: 3rem;
          }
          
          .time-capsule {
            width: 300px;
            height: 300px;
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-description {
            font-size: 1.1rem;
          }
          
          .hero-buttons {
            justify-content: center;
          }
          
          .section-title {
            font-size: 2.5rem;
          }
          
          .step-card {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }
          
          .features, .how-it-works {
            padding: 80px 0;
          }
        }
      `}</style>
        </div>
    );
};

export default HomePage; 