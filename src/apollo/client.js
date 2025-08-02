import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { APOLLO_CONFIG } from '../config/apollo.config';

const GRAPHQL_ENDPOINT = APOLLO_CONFIG.GRAPHQL_ENDPOINT;

const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// GraphQL 查询定义
export const GET_USER_SEALS = gql`
  query GetUserSeals($userAddress: String!) {
    dataStoreds(
      where: { sender: $userAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      sender
      data
      timestamp
      transactionHash
      blockNumber
    }
  }
`;

export const GET_SEAL_BY_TX_HASH = gql`
  query GetSealByTxHash($txHash: String!) {
    dataStoreds(where: { transactionHash: $txHash }) {
      id
      sender
      data
      timestamp
      transactionHash
      blockNumber
    }
  }
`;

export const GET_ALL_SEALS = gql`
  query GetAllSeals($first: Int = 100, $skip: Int = 0) {
    dataStoreds(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      sender
      data
      timestamp
      transactionHash
      blockNumber
    }
  }
`;

// 解码封印数据的辅助函数
export const decodeSealData = (encodedData) => {
  try {
    // 如果数据是hex格式，先转换为字符串
    let decodedString = encodedData;
    if (encodedData.startsWith('0x')) {
      // 将hex转换为UTF-8字符串
      decodedString = Buffer.from(encodedData.slice(2), 'hex').toString('utf8');
    }
    
    const sealData = JSON.parse(decodedString);
    
    // 计算是否已解锁
    const isUnlocked = sealData.unlockTime * 1000 <= Date.now();
    
    return {
      ...sealData,
      isUnlocked,
      parsedContent: typeof sealData.content === 'string' 
        ? JSON.parse(sealData.content) 
        : sealData.content
    };
  } catch (error) {
    console.error('解码封印数据失败:', error);
    return null;
  }
};