import { CHAIN } from "../helpers/chains";
import { FetchOptions, FetchResultV2, SimpleAdapter } from "../adapters/types";

const PERP_ADDRESS = "0x54A62D550e1754f3bB34ad80501A63815297Fccc";
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

const ABIS = {
  PositionOpened:
    "event PositionOpened(uint256 indexed positionId,address indexed trader,address indexed asset,bool isLong,uint256 size,uint256 collateral,uint256 entryPrice,uint256 tp,uint256 sl,uint256 openFee)",
  PositionClosed:
    "event PositionClosed(uint256 indexed positionId,address indexed trader,uint256 exitPrice,int256 pnl,uint256 closeFee,uint256 payoutToTrader)",
  PositionLiquidated:
    "event PositionLiquidated(uint256 indexed positionId,address indexed trader,uint256 price,int256 pnl,uint256 liquidationFee)",
  closedTrades:
    "function closedTrades(uint256) view returns (address trader,address asset,bool isLong,uint256 size,uint256 entryPrice,uint256 closePrice,uint256 collateralEngaged,int256 pnlUsdc,uint256 collateralReturned,uint256 totalFees)",
};

const toBigIntSafe = (value: any): bigint => {
  if (value === null || value === undefined) return 0n;
  try {
    return BigInt(value.toString());
  } catch {
    return 0n;
  }
};

const fetch = async (options: FetchOptions): Promise<FetchResultV2> => {
  const dailyVolume = options.createBalances();

  const openedLogs = await options.getLogs({
    target: PERP_ADDRESS,
    eventAbi: ABIS.PositionOpened,
  });

  for (const log of openedLogs) {
    const size = toBigIntSafe(log.size);
    if (size > 0n) dailyVolume.add(USDC_ADDRESS, size.toString());
  }

  const closedLogs = await options.getLogs({
    target: PERP_ADDRESS,
    eventAbi: ABIS.PositionClosed,
  });

  const liquidatedLogs = await options.getLogs({
    target: PERP_ADDRESS,
    eventAbi: ABIS.PositionLiquidated,
  });

  const closedPositionIds = [
    ...closedLogs.map((log: any) => log.positionId),
    ...liquidatedLogs.map((log: any) => log.positionId),
  ].filter(Boolean);

  if (closedPositionIds.length) {
    const closedTrades = await options.api.multiCall({
      target: PERP_ADDRESS,
      abi: ABIS.closedTrades,
      calls: closedPositionIds,
      permitFailure: true,
    });

    for (const trade of closedTrades) {
      if (!trade) continue;
      const size = toBigIntSafe((trade as any).size ?? (trade as any)[3]);
      if (size > 0n) dailyVolume.add(USDC_ADDRESS, size.toString());
    }
  }

  return { dailyVolume };
};

const methodology = {
  Volume:
    "Daily volume is tracked onchain from Arbitrum events. It counts position notional from PositionOpened events and finalized PositionClosed/PositionLiquidated records read from the perp contract.",
};

const adapter: SimpleAdapter = {
  version: 2,
  pullHourly: true,
  fetch,
  chains: [CHAIN.ARBITRUM],
  start: "2026-04-15",
  methodology,
};

export default adapter;

