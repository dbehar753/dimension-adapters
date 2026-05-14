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
  RolloverAccrued:
    "event RolloverAccrued(uint256 indexed positionId,uint256 feeUsdc,uint256 totalAccruedFeeUsdc,uint256 asOfTimestamp)",
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
  const dailyFees = options.createBalances();
  const dailyUserFees = options.createBalances();

  const openedLogs = await options.getLogs({
    target: PERP_ADDRESS,
    eventAbi: ABIS.PositionOpened,
  });

  const closedLogs = await options.getLogs({
    target: PERP_ADDRESS,
    eventAbi: ABIS.PositionClosed,
  });

  const liquidatedLogs = await options.getLogs({
    target: PERP_ADDRESS,
    eventAbi: ABIS.PositionLiquidated,
  });

  const rolloverLogs = await options.getLogs({
    target: PERP_ADDRESS,
    eventAbi: ABIS.RolloverAccrued,
  });

  for (const log of openedLogs) {
    const fee = toBigIntSafe(log.openFee);
    if (fee > 0n) {
      dailyFees.add(USDC_ADDRESS, fee.toString());
      dailyUserFees.add(USDC_ADDRESS, fee.toString());
    }
  }

  for (const log of closedLogs) {
    const fee = toBigIntSafe(log.closeFee);
    if (fee > 0n) {
      dailyFees.add(USDC_ADDRESS, fee.toString());
      dailyUserFees.add(USDC_ADDRESS, fee.toString());
    }
  }

  for (const log of liquidatedLogs) {
    const fee = toBigIntSafe(log.liquidationFee);
    if (fee > 0n) {
      dailyFees.add(USDC_ADDRESS, fee.toString());
      dailyUserFees.add(USDC_ADDRESS, fee.toString());
    }
  }

  for (const log of rolloverLogs) {
    const fee = toBigIntSafe(log.feeUsdc);
    if (fee > 0n) {
      dailyFees.add(USDC_ADDRESS, fee.toString());
      dailyUserFees.add(USDC_ADDRESS, fee.toString());
    }
  }

  return {
    dailyFees,
    dailyUserFees,
  };
};

const methodology = {
  Fees:
    "Daily fees are tracked onchain from Arbitrum events and include open fees, close fees, liquidation fees, and rollover accruals emitted by the perp contract.",
  UserFees:
    "Daily user fees are the total fees paid by traders onchain, including open fees, close fees, liquidation fees, and rollover accruals.",
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


