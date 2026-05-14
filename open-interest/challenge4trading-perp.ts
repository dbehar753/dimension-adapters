import { FetchOptions, SimpleAdapter } from "../adapters/types";

const fetch = async ({ startTimestamp, endTimestamp }: FetchOptions) => {
  const res = await fetch(`https://api-backend-mainnet.up.railway.app/defillama/derivatives?start=${startTimestamp}&end=${endTimestamp}`);
  const data = await res.json();

  return {
    openInterestAtEnd: data.openInterestAtEndUsd,
    longOpenInterestAtEnd: data.longOpenInterestAtEndUsd,
    shortOpenInterestAtEnd: data.shortOpenInterestAtEndUsd,
  };
};

const methodology = {
  OpenInterest: "Open interest is computed by the live production backend from positions that remain open at the end of the requested time window.",
};

const adapter: SimpleAdapter = {
  version: 2,
  adapter: {
    arbitrum: {
      fetch,
      start: "2026-04-15",
      meta: {
        methodology,
      },
    },
  },
};

export default adapter;
