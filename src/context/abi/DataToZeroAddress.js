export const ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "DataStored",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "storeData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
