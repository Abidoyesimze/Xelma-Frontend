import { rpc, Contract, TransactionBuilder, BASE_FEE, Networks, Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

import { rpc, Contract, TransactionBuilder, BASE_FEE, Networks, Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

import { rpc, Contract, TransactionBuilder, BASE_FEE, Networks, Address, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { freighterAdapter } from './wallets';


const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const XELMA_CONTRACT_ID = import.meta.env.VITE_XELMA_CONTRACT_ID || 'CD7V3L7JIP52EXWLYSOWXND4F3N65QZ2R54H6M77Y3S37Z55XHLXELMA';
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

const rpcServer = new rpc.Server(RPC_URL);

export interface ContractTransactionResult {
  txHash: string;
  ledger: number;
}

export interface SorobanInspectorSnapshot {
  position: unknown;
  round: unknown;
  source: 'rpc' | 'mock';
  error?: string;
  inspectedAt: string;
}

function mockInspectorSnapshot(error?: unknown): SorobanInspectorSnapshot {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  return {
    position: { direction: 'UP', stake: '100 vXLM', status: 'mocked' },
    round: { id: 'mock-round', state: 'open', closesIn: 'mock/fallback' },
    source: 'mock',
    error: message,
    inspectedAt: new Date().toISOString(),
  };
}

async function simulateReadOnly(sourceAddress: string, functionName: string, args: xdr.ScVal[]): Promise<unknown> {
  const account = await rpcServer.getAccount(sourceAddress);
  const contractInstance = new Contract(XELMA_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contractInstance.call(functionName, ...args))
    .setTimeout(30)
    .build();

  const simulation = await rpcServer.simulateTransaction(tx);
  if ('error' in simulation && simulation.error) {
    throw new Error(`Read-only ${functionName} failed: ${simulation.error}`);
  }

  const simWithResults = simulation as { results?: Array<{ retval?: xdr.ScVal }> };
  const result = simWithResults.results?.[0]?.retval;
  return result ? scValToNative(result) : null;
}

export async function inspectSorobanState(userAddress: string): Promise<SorobanInspectorSnapshot> {
  try {
    const walletArg = new Address(userAddress).toScVal();
    const [position, round] = await Promise.all([
      simulateReadOnly(userAddress, 'get_position', [walletArg]),
      simulateReadOnly(userAddress, 'get_round_state', []),
    ]);

    return {
      position,
      round,
      source: 'rpc',
      inspectedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Soroban inspector using mock fallback:', err);
    return mockInspectorSnapshot(err);
  }
}

/** Fee and resource breakdown from a Soroban simulation. */
export interface FeeEstimate {
  /** Network base fee (stroops → XLM). */
  baseFee: string;
  /** Minimum resource fee charged by Soroban (stroops → XLM). */
  resourceFee: string;
  /** Total fee = baseFee + resourceFee (XLM). */
  totalFee: string;
  /** CPU instructions consumed by the contract call. */
  instructions: string;
  /** Ledger read bytes. */
  readBytes: string;
  /** Ledger write bytes. */
  writeBytes: string;
  /**
   * Base64 XDR of the prepared (unsigned) transaction — the exact payload that
   * will be handed to Freighter for approval.
   */
  xdr: string;
  /** Hash of the prepared transaction, before signing. */
  hash: string;
  /** Network passphrase the transaction is built against. */
  networkPassphrase: string;
}

const STROOPS_PER_XLM = 10_000_000;

function stroopsToXlm(stroops: number): string {
  return (stroops / STROOPS_PER_XLM).toFixed(7);
}

/**
 * Polls for the transaction status until it is no longer PENDING.
 */
async function pollTransaction(txHash: string): Promise<ContractTransactionResult> {
  const maxAttempts = 30;
  const intervalMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const txResult = await rpcServer.getTransaction(txHash);

      if (txResult.status === 'SUCCESS') {
        return {
          txHash,
          ledger: txResult.ledger,
        };
      }

      if (txResult.status === 'FAILED') {
        throw new Error(`Transaction failed on-chain: ${txResult.resultMetaXdr || 'unknown failure reason'}`);
      }
    } catch (err) {
      // If error is not a pending response, propagate it
      if (err instanceof Error && !err.message.includes('pending')) {
        throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Transaction polling timed out after 60 seconds.');
}

/**
 * Common transaction preparation and sign/submit wrapper
 */
async function executeContractCall(
  userAddress: string,
  functionName: string,
  args: xdr.ScVal[],
  onStatus?: (status: 'preparing' | 'signing' | 'submitting') => void
): Promise<ContractTransactionResult> {
  // 1. Fetch source account from RPC
  onStatus?.('preparing');
  let account;
  try {
    account = await rpcServer.getAccount(userAddress);
  } catch (err) {
    console.error('Failed to get account details from RPC:', err);
    throw new Error('Stellar account not found or unfunded on Testnet. Please fund your address first.');
  }

  // 2. Build the initial transaction
  const contractInstance = new Contract(XELMA_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contractInstance.call(functionName, ...args))
    .setTimeout(60)
    .build();

  // 3. Simulate the transaction to find resource fees/footprint
  let simulation;
  try {
    simulation = await rpcServer.simulateTransaction(tx);
  } catch (err) {
    console.error('Transaction simulation request failed:', err);
    throw new Error('Simulation failed. Network error or contract invocation rejected.');
  }

  if ('error' in simulation && simulation.error) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  // 4. Prepare transaction with simulation footprint results
  let preparedTx;
  try {
    preparedTx = await rpcServer.prepareTransaction(tx);
  } catch (err) {
    console.error('Failed to prepare transaction footprint:', err);
    throw new Error('Failed to assemble transaction layout with simulated resources.');
  }

  // 5. Sign with the connected wallet
  let signedXdrString: string;
  try {
    onStatus?.('signing');
    signedXdrString = await freighterAdapter.signTransaction(preparedTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
  } catch (err) {
    console.error('Wallet sign transaction error:', err);
    throw new Error(
      err instanceof Error ? err.message : 'Failed to sign transaction with your wallet.',
    );
  }

  // 6. Submit the signed transaction to RPC
  const transactionToSubmit = TransactionBuilder.fromXDR(signedXdrString, NETWORK_PASSPHRASE);
  let submission;
  try {
    onStatus?.('submitting');
    submission = await rpcServer.sendTransaction(transactionToSubmit);
  } catch (err) {
    console.error('Transaction submission request failed:', err);
    throw new Error('Failed to broadcast transaction to Stellar RPC.');
  }

  if (submission.status === 'ERROR') {
    throw new Error(`Transaction rejected by network: ${submission.errorResult || 'unknown error'}`);
  }

  // 7. Poll for transaction completion
  return pollTransaction(submission.hash);
}

/**
 * Build, simulate, and prepare a Soroban transaction — returns a fee/resource
 * estimate without requiring a Freighter signature. This lets the UI show
 * costs before the user approves in their wallet.
 *
 * Throws on simulation failure so the caller can display a clear error.
 */
async function simulateContractCall(
  userAddress: string,
  functionName: string,
  args: xdr.ScVal[],
): Promise<FeeEstimate> {
  let account;
  try {
    account = await rpcServer.getAccount(userAddress);
  } catch {
    throw new Error('Stellar account not found or unfunded on Testnet. Please fund your address first.');
  }

  const contractInstance = new Contract(XELMA_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contractInstance.call(functionName, ...args))
    .setTimeout(60)
    .build();

  let simulation;
  try {
    simulation = await rpcServer.simulateTransaction(tx);
  } catch {
    throw new Error('Simulation failed. Network error or contract invocation rejected.');
  }

  if (!rpc.Api.isSimulationSuccess(simulation)) {
    const error = rpc.Api.isSimulationError(simulation) ? simulation.error : 'Unknown simulation error';
    throw new Error(`Simulation failed: ${error}`);
  }

  // Narrow to success response after the error check above.
  // Use ReturnType inference since SimulateTransactionSuccessResponse is
  // not exported by name in this stellar-sdk version.
  type SimSuccess = Exclude<Awaited<ReturnType<typeof rpcServer.simulateTransaction>>, { error: unknown }>;
  const simResult = simulation as SimSuccess;

  // Prepare applies the simulation footprint & resource fee to the tx
  const preparedTx = await rpcServer.prepareTransaction(tx);

  const simDetails = simulation as { minResourceFee?: string | number; cost?: { cpuInsns?: string | number; readBytes?: string | number; writeBytes?: string | number } };
  const baseFeeStroops = Number(BASE_FEE) || 100;
  const resourceFeeStroops = simDetails.minResourceFee ? Number(simDetails.minResourceFee) : 0;

  const resourceFeeStroops = simDetails.minResourceFee ? Number(simDetails.minResourceFee) : 0;

  const resourceFeeStroops = simResult.minResourceFee ? Number(simResult.minResourceFee) : 0;


  return {
    baseFee: stroopsToXlm(baseFeeStroops),
    resourceFee: stroopsToXlm(resourceFeeStroops),
    totalFee: stroopsToXlm(baseFeeStroops + resourceFeeStroops),
    instructions: simDetails.cost?.cpuInsns ? String(simDetails.cost.cpuInsns) : '0',
    readBytes: simDetails.cost?.readBytes ? String(simDetails.cost.readBytes) : '0',
    writeBytes: simDetails.cost?.writeBytes ? String(simDetails.cost.writeBytes) : '0',

    instructions: simDetails.cost?.cpuInsns ? String(simDetails.cost.cpuInsns) : '0',
    readBytes: simDetails.cost?.readBytes ? String(simDetails.cost.readBytes) : '0',
    writeBytes: simDetails.cost?.writeBytes ? String(simDetails.cost.writeBytes) : '0',

    instructions: simulation.cost?.cpuInsns ? String(simulation.cost.cpuInsns) : '0',
    readBytes: '0',
    writeBytes: '0',
    xdr: preparedTx.toXDR(),
    hash: preparedTx.hash().toString('hex'),
    networkPassphrase: NETWORK_PASSPHRASE,

  };
}

/**
 * Estimate fee and resources for an UP/DOWN bet without sending a transaction.
 */
export async function estimatePlaceBet(
  userAddress: string,
  direction: 'UP' | 'DOWN',
  stake: string,
): Promise<FeeEstimate> {
  const amountStroops = BigInt(Math.round(parseFloat(stake) * 10_000_000));
  const args = [
    new Address(userAddress).toScVal(),
    nativeToScVal(direction, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'u128' }),
  ];
  return simulateContractCall(userAddress, 'place_bet', args);
}

/**
 * Estimate fee and resources for a precision / Legend prediction without
 * sending a transaction.
 */
export async function estimatePrecisionPrediction(
  userAddress: string,
  direction: 'UP' | 'DOWN',
  stake: string,
  exactPrice: string,
): Promise<FeeEstimate> {
  const amountStroops = BigInt(Math.round(parseFloat(stake) * 10_000_000));
  const exactPriceScaled = BigInt(Math.round(parseFloat(exactPrice) * 10_000));
  const args = [
    new Address(userAddress).toScVal(),
    nativeToScVal(direction, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'u128' }),
    nativeToScVal(exactPriceScaled, { type: 'u64' }),
  ];
  return simulateContractCall(userAddress, 'place_precision_prediction', args);
}

/**
 * Places a standard UP or DOWN bet on the active round.
 * @param userAddress The public key of the user.
 * @param direction "UP" | "DOWN"
 * @param stake Amount in XLM (converted to stroops).
 */
export async function place_bet(
  userAddress: string,
  direction: 'UP' | 'DOWN',
  stake: string,
  onStatus?: (status: 'preparing' | 'signing' | 'submitting') => void
): Promise<ContractTransactionResult> {
  const amountStroops = BigInt(Math.round(parseFloat(stake) * 10_000_000));
  const args = [
    new Address(userAddress).toScVal(),
    nativeToScVal(direction, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'u128' }),
  ];

  return executeContractCall(userAddress, 'place_bet', args, onStatus);
}

/**
 * Places a precision / Legend prediction on the active round.
 * @param userAddress The public key of the user.
 * @param direction "UP" | "DOWN"
 * @param stake Amount in XLM (converted to stroops).
 * @param exactPrice Target exact price.
 */
export async function place_precision_prediction(
  userAddress: string,
  direction: 'UP' | 'DOWN',
  stake: string,
  exactPrice: string,
  onStatus?: (status: 'preparing' | 'signing' | 'submitting') => void
): Promise<ContractTransactionResult> {
  const amountStroops = BigInt(Math.round(parseFloat(stake) * 10_000_000));
  // Scale the exact price to a 4-decimal integer for contract representation
  const exactPriceScaled = BigInt(Math.round(parseFloat(exactPrice) * 10_000));

  const args = [
    new Address(userAddress).toScVal(),
    nativeToScVal(direction, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'u128' }),
    nativeToScVal(exactPriceScaled, { type: 'u64' }),
  ];

  return executeContractCall(userAddress, 'place_precision_prediction', args, onStatus);
}

/**
 * Claims pending winnings for the user.
 * @param userAddress The public key of the user.
 */
export async function claim_winnings(
  userAddress: string,
  onStatus?: (status: 'preparing' | 'signing' | 'submitting') => void
): Promise<ContractTransactionResult> {
  const args = [
    new Address(userAddress).toScVal(),
  ];

  return executeContractCall(userAddress, 'claim_winnings', args, onStatus);
}
