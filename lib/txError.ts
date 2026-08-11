/**
 * Map a wagmi/viem write error into a short, user-friendly message covering the
 * common failure modes: user rejection, insufficient funds for gas, contract
 * revert, and generic network errors.
 */
export function parseTxError(error: unknown): string {
  if (!error) return "Unknown error";
  const err = error as {
    code?: number;
    name?: string;
    message?: string;
    shortMessage?: string;
  };
  const msg = `${err.shortMessage ?? ""} ${err.message ?? ""}`.toLowerCase();

  // EIP-1193 user-rejected code, or text variants.
  if (err.code === 4001 || /user rejected|user denied|rejected the request/.test(msg)) {
    return "Transaction rejected in wallet.";
  }
  if (/insufficient funds/.test(msg)) {
    return "Insufficient ETH to cover gas.";
  }
  if (/transfer amount exceeds balance|exceeds balance/.test(msg)) {
    return "Token balance too low for this transfer.";
  }
  if (err.name === "ContractFunctionExecutionError" || /revert/.test(msg)) {
    // Surface the contract's reason string if viem extracted one.
    return err.shortMessage ?? "Contract reverted the transaction.";
  }
  if (/network|timeout|fetch|connection/.test(msg)) {
    return "Network error. Check your connection and try again.";
  }
  return err.shortMessage ?? "Transaction failed. Please try again.";
}
