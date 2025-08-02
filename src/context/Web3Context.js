import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { ABI } from "./abi/DataToZeroAddress";
import {
  apolloClient,
  GET_USER_SEALS,
  GET_SEAL_BY_TX_HASH,
  decodeSealData,
} from "../apollo/client";
import { da } from "date-fns/locale";

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
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

  // Monad 测试网配置
  const MONAD_CHAIN_CONFIG = {
    chainId: "0x279F", // 10143 in hex
    chainName: "Monad Testnet",
    nativeCurrency: {
      name: "MON",
      symbol: "MON",
      decimals: 18,
    },
    rpcUrls: ["https://testnet-rpc.monad.xyz"],
    blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
  };

  // 智能合约配置 (需要部署到 Monad 测试网)
  // TODO: 请部署 ChronoVault 合约到 Monad 测试网并替换此地址
  const CONTRACT_ADDRESS = "0xB095DE5c9d0bceF7B1Bc3e1B04da28D9852Ad36A"; // 占位符地址 - 需要替换
  const CONTRACT_ABI = ABI;

  console.log(ABI);
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("请安装 MetaMask 钱包");
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();

      // Check if we're on the correct chain
      await switchToMonadTestnet();

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

      toast.success("钱包连接成功！");
    } catch (error) {
      console.error("连接钱包失败:", error);
      toast.error("连接钱包失败");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToMonadTestnet = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_CHAIN_CONFIG.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [MONAD_CHAIN_CONFIG],
          });
        } catch (addError) {
          throw new Error("添加 Monad 测试网失败");
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
    toast.success("钱包已断开连接");
  };

  const createSeal = async (content, unlockTime, mediaIds = "") => {
    if (!contract) {
      toast.error("请先连接钱包");
      return null;
    }

    try {
      // 创建封印数据对象
      const sealData = {
        content,
        unlockTime,
        mediaIds,
        creator: account,
        createdAt: Date.now(),
      };
      console.log(sealData, 1111);
      // 将数据编码为bytes
      const jsonString = JSON.stringify(sealData);
      const encodedData = ethers.toUtf8Bytes(jsonString);

      const tx = await contract.storeData(encodedData);
      toast.loading("正在创建时间封印...", { id: "create-seal" });

      const receipt = await tx.wait();
      toast.success("时间封印创建成功！", { id: "create-seal" });

      // 返回交易哈希作为封印ID
      return receipt.hash;
    } catch (error) {
      console.error("创建封印失败:", error);
      toast.error("创建封印失败", { id: "create-seal" });
      return null;
    }
  };

  const getSeal = async (txHash) => {
    try {
      // 使用Apollo Client查询封印数据
      const { data, error } = await apolloClient.query({
        query: GET_SEAL_BY_TX_HASH,
        variables: { txHash },
        fetchPolicy: "network-only", // 强制从网络获取最新数据
      });

      if (error) {
        console.error("GraphQL查询错误:", error);
        toast.error("查询封印数据失败");
        return null;
      }

      if (!data?.dataStoreds || data.dataStoreds.length === 0) {
        toast.error("未找到对应的封印数据");
        return null;
      }

      const sealEvent = data.dataStoreds[0];
      const decodedSeal = decodeSealData(sealEvent.data);

      if (!decodedSeal) {
        toast.error("解码封印数据失败");
        return null;
      }

      return {
        ...decodedSeal,
        txHash: sealEvent.transactionHash,
        blockNumber: sealEvent.blockNumber,
        timestamp: sealEvent.timestamp,
      };
    } catch (error) {
      console.error("获取封印数据失败:", error);
      toast.error("获取封印数据失败");
      return null;
    }
  };

  const getUserSeals = async (userAddress = account) => {
    if (!userAddress) {
      console.warn("用户地址不存在");
      return [];
    }

    try {
      // 使用Apollo Client查询用户的所有封印
      const { data, error } = await apolloClient.query({
        query: GET_USER_SEALS,
        variables: { userAddress: userAddress.toLowerCase() },
        fetchPolicy: "network-only",
      });

      if (error) {
        console.error("GraphQL查询错误:", error);
        return [];
      }
      console.log(data, 123123);
      if (!data?.dataStoreds) {
        return [];
      }

      // 处理查询结果，解码每个封印数据
      const seals = data.dataStoreds
        .map((sealEvent) => {
          const decodedSeal = decodeSealData(sealEvent.data);
          if (!decodedSeal) return null;

          return {
            id: sealEvent.transactionHash, // 使用交易哈希作为ID
            ...decodedSeal,
            txHash: sealEvent.transactionHash,
            blockNumber: sealEvent.blockNumber,
            timestamp: sealEvent.timestamp,
          };
        })
        .filter((seal) => seal !== null);

      return seals;
    } catch (error) {
      console.error("获取用户封印失败:", error);
      return [];
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
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
