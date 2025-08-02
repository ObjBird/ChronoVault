import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Polygon Mumbai 测试网配置
    const MONAD_CHAIN_CONFIG = {
        chainId: '0x13881', // Polygon Mumbai 测试网
        chainName: 'Polygon Mumbai',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com'], // Mumbai RPC URL
        blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    };

    // 智能合约配置 (需要部署到 Polygon Mumbai 测试网)
    // TODO: 请部署 ChronoVault 合约到 Mumbai 测试网并替换此地址
    const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // 占位符地址 - 需要替换
    const CONTRACT_ABI = [
        // Placeholder ABI - 实际使用时需要替换为真实的合约ABI
        {
            "inputs": [
                { "internalType": "string", "name": "_content", "type": "string" },
                { "internalType": "uint256", "name": "_unlockTime", "type": "uint256" },
                { "internalType": "string", "name": "_mediaIds", "type": "string" }
            ],
            "name": "createSeal",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "_sealId", "type": "uint256" }],
            "name": "getSeal",
            "outputs": [
                { "internalType": "string", "name": "content", "type": "string" },
                { "internalType": "uint256", "name": "unlockTime", "type": "uint256" },
                { "internalType": "string", "name": "mediaIds", "type": "string" },
                { "internalType": "address", "name": "creator", "type": "address" },
                { "internalType": "bool", "name": "isUnlocked", "type": "bool" }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
            "name": "getUserSeals",
            "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('请安装 MetaMask 钱包');
            return;
        }

        setIsConnecting(true);
        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            // Create provider and signer
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();

            // Check if we're on the correct chain
            await switchToPolygonMumbai();

            // Create contract instance
            const contractInstance = new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                web3Signer
            );

            setProvider(web3Provider);
            setSigner(web3Signer);
            setAccount(accounts[0]);
            setContract(contractInstance);
            setIsConnected(true);

            toast.success('钱包连接成功！');
        } catch (error) {
            console.error('连接钱包失败:', error);
            toast.error('连接钱包失败');
        } finally {
            setIsConnecting(false);
        }
    };

    const switchToPolygonMumbai = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: MONAD_CHAIN_CONFIG.chainId }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [MONAD_CHAIN_CONFIG],
                    });
                } catch (addError) {
                    throw new Error('添加 Polygon Mumbai 测试网失败');
                }
            } else {
                throw switchError;
            }
        }
    };

    const disconnectWallet = () => {
        setProvider(null);
        setSigner(null);
        setAccount(null);
        setContract(null);
        setIsConnected(false);
        toast.success('钱包已断开连接');
    };

    const createSeal = async (content, unlockTime, mediaIds = '') => {
        if (!contract) {
            toast.error('请先连接钱包');
            return null;
        }

        try {
            const tx = await contract.createSeal(content, unlockTime, mediaIds);
            toast.loading('正在创建时间封印...', { id: 'create-seal' });

            const receipt = await tx.wait();
            toast.success('时间封印创建成功！', { id: 'create-seal' });

            // Extract seal ID from transaction logs
            const sealId = receipt.logs[0]?.args?.[0] || 0;
            return sealId;
        } catch (error) {
            console.error('创建封印失败:', error);
            toast.error('创建封印失败', { id: 'create-seal' });
            return null;
        }
    };

    const getSeal = async (sealId) => {
        if (!contract) {
            toast.error('请先连接钱包');
            return null;
        }

        try {
            const sealData = await contract.getSeal(sealId);
            return {
                content: sealData[0],
                unlockTime: Number(sealData[1]),
                mediaIds: sealData[2],
                creator: sealData[3],
                isUnlocked: sealData[4],
            };
        } catch (error) {
            console.error('获取封印数据失败:', error);
            toast.error('获取封印数据失败');
            return null;
        }
    };

    const getUserSeals = async (userAddress = account) => {
        if (!contract || !userAddress) {
            return [];
        }

        try {
            const sealIds = await contract.getUserSeals(userAddress);
            return sealIds.map(id => Number(id));
        } catch (error) {
            console.error('获取用户封印失败:', error);
            return [];
        }
    };

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    setAccount(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, []);

    const value = {
        provider,
        signer,
        account,
        contract,
        isConnecting,
        isConnected,
        connectWallet,
        disconnectWallet,
        createSeal,
        getSeal,
        getUserSeals,
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}; 