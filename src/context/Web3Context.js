import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { ABI } from "./abi/DataToZeroAddress";

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
  const CONTRACT_ADDRESS = "0xAB00cF2B1f57693636D32fa50Bb3A25c04DB3a52"; // 占位符地址 - 需要替换
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

  // 解码封印数据的辅助函数
  const decodeSealData = (encodedData) => {
    try {
      // 如果数据是hex格式，先转换为字符串
      let decodedString = encodedData;
      if (encodedData.startsWith("0x")) {
        // 使用ethers.js的toUtf8String方法将hex转换为UTF-8字符串
        decodedString = ethers.toUtf8String(encodedData);
      }

      const sealData = JSON.parse(decodedString);

      // 计算是否已解锁
      const isUnlocked = sealData.unlockTime * 1000 <= Date.now();

      return {
        ...sealData,
        isUnlocked,
        parsedContent:
          typeof sealData.content === "string"
            ? JSON.parse(sealData.content)
            : sealData.content,
      };
    } catch (error) {
      console.error("解码封印数据失败:", error);
      return null;
    }
  };

  const getSeal = async (id) => {
    try {
      // 检查是否是method_call格式的ID
      if (id.startsWith("method_call_")) {
        const index = parseInt(id.replace("method_call_", ""));
        if (isNaN(index)) {
          toast.error("无效的封印ID格式");
          return null;
        }

        // 通过索引获取方法调用记录
        const methodCall = await getMethodCall(index);
        if (!methodCall) {
          toast.error("未找到对应的封印记录");
          return null;
        }

        return {
          ...methodCall,
          id: id, // 保持原始ID
        };
      } else {
        // 原来的逻辑：处理交易哈希
        const receipt = await provider.getTransactionReceipt(id);
        if (!receipt) {
          toast.error("未找到对应的交易");
          return null;
        }

        // 解析事件日志
        const iface = new ethers.Interface(CONTRACT_ABI);
        const dataStoredEvent = receipt.logs.find((log) => {
          try {
            const parsed = iface.parseLog(log);
            return parsed.name === "DataStored";
          } catch {
            return false;
          }
        });

        if (!dataStoredEvent) {
          toast.error("未找到封印数据事件");
          return null;
        }

        const parsed = iface.parseLog(dataStoredEvent);
        const decodedSeal = decodeSealData(parsed.args.data);

        if (!decodedSeal) {
          toast.error("解码封印数据失败");
          return null;
        }

        return {
          ...decodedSeal,
          id: id,
          txHash: id,
          blockNumber: receipt.blockNumber,
          timestamp: parsed.args.timestamp,
        };
      }
    } catch (error) {
      console.error("获取封印数据失败:", error);
      toast.error("获取封印数据失败");
      return null;
    }
  };

  const getUserSeals = async (userAddress = account) => {
    if (!userAddress || !contract || !provider) {
      console.warn("用户地址或合约不存在");
      return [];
    }

    try {
      // 使用新的读取方法获取所有方法调用记录
      const allMethodCalls = await contract.getAllMethodCalls();

      // 过滤出当前用户的封印数据
      const userSeals = allMethodCalls
        .filter(call => call.caller.toLowerCase() === userAddress.toLowerCase())
        .map((call, index) => {
          try {
            const decodedSeal = decodeSealData(call.data);
            if (decodedSeal) {
              return {
                id: `method_call_${index}`,
                methodCallIndex: index, // 保存方法调用索引
                ...decodedSeal,
                caller: call.caller,
                methodName: call.methodName,
                timestamp: call.timestamp,
              };
            }
            return null;
          } catch (error) {
            console.error("解码单个封印失败:", error);
            return null;
          }
        })
        .filter(seal => seal !== null);

      // 按时间戳排序（最新的在前）
      userSeals.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      return userSeals;
    } catch (error) {
      console.error("获取用户封印失败:", error);
      // 如果新方法失败，回退到原来的事件查询方法
      return await getUserSealsLegacy(userAddress);
    }
  };

  // 保留原来的事件查询方法作为备用
  const getUserSealsLegacy = async (userAddress = account) => {
    if (!userAddress || !contract || !provider) {
      console.warn("用户地址或合约不存在");
      return [];
    }

    try {
      // 获取当前区块号
      const currentBlock = await provider.getBlockNumber();

      // 分批查询事件，避免请求负载过大
      const batchSize = 10000; // 每次查询10000个区块
      const filter = contract.filters.DataStored(userAddress);
      const allEvents = [];

      // 从最近的区块开始往前查询，限制查询范围以避免超时
      const maxBlocksToQuery = 50000; // 最多查询最近50000个区块
      const startBlock = Math.max(0, currentBlock - maxBlocksToQuery);

      for (
        let fromBlock = startBlock;
        fromBlock <= currentBlock;
        fromBlock += batchSize
      ) {
        const toBlock = Math.min(fromBlock + batchSize - 1, currentBlock);

        try {
          console.log(`查询区块范围: ${fromBlock} - ${toBlock}`);
          const events = await contract.queryFilter(filter, fromBlock, toBlock);
          allEvents.push(...events);
        } catch (batchError) {
          console.warn(`查询区块 ${fromBlock}-${toBlock} 失败:`, batchError);
          // 继续查询下一批，不中断整个过程
        }
      }

      console.log("Found events:", allEvents.length);

      // 处理事件数据
      const seals = [];

      for (const event of allEvents) {
        try {
          const decodedSeal = decodeSealData(event.args.data);
          if (decodedSeal) {
            seals.push({
              id: event.transactionHash,
              ...decodedSeal,
              txHash: event.transactionHash,
              blockNumber: event.blockNumber,
              timestamp: event.args.timestamp,
            });
          }
        } catch (error) {
          console.error("解码单个封印失败:", error);
        }
      }

      // 按时间戳排序（最新的在前）
      seals.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      return seals;
    } catch (error) {
      console.error("获取用户封印失败:", error);
      return [];
    }
  };

  // 获取调用总数
  const getCallCount = async () => {
    if (!contract) {
      console.warn("合约不存在");
      return 0;
    }

    try {
      const count = await contract.callCount();
      return Number(count);
    } catch (error) {
      console.error("获取调用总数失败:", error);
      return 0;
    }
  };

  // 根据索引获取单个方法调用记录
  const getMethodCall = async (index) => {
    if (!contract) {
      console.warn("合约不存在");
      return null;
    }

    try {
      const methodCall = await contract.getMethodCall(index);
      const decodedSeal = decodeSealData(methodCall.data);

      if (decodedSeal) {
        return {
          ...decodedSeal,
          caller: methodCall.caller,
          methodName: methodCall.methodName,
          timestamp: methodCall.timestamp,
          index,
        };
      }
      return null;
    } catch (error) {
      console.error("获取方法调用记录失败:", error);
      return null;
    }
  };

  // 获取所有方法调用记录
  const getAllMethodCalls = async () => {
    if (!contract) {
      console.warn("合约不存在");
      return [];
    }

    try {
      const allCalls = await contract.getAllMethodCalls();

      return allCalls.map((call, index) => {
        try {
          const decodedSeal = decodeSealData(call.data);
          if (decodedSeal) {
            return {
              ...decodedSeal,
              caller: call.caller,
              methodName: call.methodName,
              timestamp: call.timestamp,
              index,
            };
          }
          return null;
        } catch (error) {
          console.error("解码方法调用记录失败:", error);
          return null;
        }
      }).filter(call => call !== null);
    } catch (error) {
      console.error("获取所有方法调用记录失败:", error);
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
    getCallCount,
    getMethodCall,
    getAllMethodCalls,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
