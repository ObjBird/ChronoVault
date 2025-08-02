// Apollo Client 配置文件
// 用户需要根据实际的GraphQL服务配置这些值

export const APOLLO_CONFIG = {
  // Monad Testnet GraphQL 端点
  // 你需要部署一个GraphQL服务或使用The Graph来索引合约事件
  // 示例端点 (需要替换为实际的GraphQL服务)
  GRAPHQL_ENDPOINT:
    "https://api.studio.thegraph.com/query/113356/my-subgraph-send-data/version/latest",

  // 合约地址 (应该与Web3Context中的CONTRACT_ADDRESS匹配)
  CONTRACT_ADDRESS: "0xB095DE5c9d0bceF7B1Bc3e1B04da28D9852Ad36A",

  // 网络配置
  NETWORK: {
    chainId: 10143,
    name: "Monad Testnet",
    blockExplorer: "https://testnet.monadexplorer.com",
  },
};

// 如果你使用The Graph Protocol，你需要创建一个subgraph来索引DataStored事件
// subgraph.yaml 示例配置:
/*
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: DataToZeroAddress
    network: monad-testnet
    source:
      address: "0xB095DE5c9d0bceF7B1Bc3e1B04da28D9852Ad36A"
      abi: DataToZeroAddress
      startBlock: <部署合约的区块号>
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - DataStored
      abis:
        - name: DataToZeroAddress
          file: ./abis/DataToZeroAddress.json
      eventHandlers:
        - event: DataStored(indexed address,bytes,uint256)
          handler: handleDataStored
      file: ./src/mapping.ts
*/

// schema.graphql 示例:
/*
type DataStored @entity {
  id: ID!
  sender: Bytes! # address
  data: Bytes! # bytes
  timestamp: BigInt! # uint256
  transactionHash: Bytes!
  blockNumber: BigInt!
  blockTimestamp: BigInt!
}
*/
