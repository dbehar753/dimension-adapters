import { FetchOptions, SimpleAdapter } from "../adapters/types";

const fetch = async ({ startTimestamp, endTimestamp }: FetchOptions) => {
  const res = await fetch(`https://api-backend-mainnet.up.railway.app/defillama/fees?start=${startTimestamp}&end=${endTimestamp}`);
  const data = await res.json();

  return {
    dailyFees: data.dailyFeesUsd,
    dailyRevenue: data.dailyRevenueUsd,
    dailyUserFees: data.dailyUserFeesUsd,
  };
};

const methodology = {
  Fees: "Daily fees are computed by the live production backend from open fees, close fees, liquidation fees, and rollover fees charged during the requested time window.",
  Revenue: "Daily revenue is computed by the live production backend from protocol-accounted fee revenue during the requested time window.",
  UserFees: "Daily user fees represent the total fees paid by traders during the requested time window.",
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
