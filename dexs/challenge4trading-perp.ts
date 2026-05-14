import { FetchOptions, SimpleAdapter } from "../adapters/types";

const adapterFetch = async ({ startTimestamp, endTimestamp }: FetchOptions) => {
  const res = await globalThis.fetch(
    `https://api-backend-mainnet.up.railway.app/defillama/derivatives?start=${startTimestamp}&end=${endTimestamp}`
  );
  const data = await res.json();

  return {
    dailyVolume: data.dailyVolumeUsd,
  };
};

const methodology = {
  Volume: "Daily volume is computed by the live production backend from executed perpetual trades during the requested time window.",
};

const adapter: SimpleAdapter = {
  version: 2,
  adapter: {
    arbitrum: {
      fetch: adapterFetch,
      start: "2026-04-15",
      meta: {
        methodology,
      },
    },
  },
};

export default adapter;

