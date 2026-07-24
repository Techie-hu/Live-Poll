import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDPZIOJ5L4VJWAJ4NQ2G4FEQHEGDECJVY5YIN5IDWDOYS5252EHECGPT",
  }
} as const


export interface Poll {
  options: Array<PollOption>;
  question: string;
}


export interface Results {
  options: Array<readonly [string, u32]>;
  question: string;
}


export interface PollOption {
  text: string;
  votes: u32;
}

export interface Client {
  /**
   * Construct and simulate a vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  vote: ({voter, option_index}: {voter: string, option_index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: (args: {question: string, options: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_results transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_results: (options?: MethodOptions) => Promise<AssembledTransaction<Results>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABFBvbGwAAAACAAAAAAAAAAdvcHRpb25zAAAAA+oAAAfQAAAAClBvbGxPcHRpb24AAAAAAAAAAAAIcXVlc3Rpb24AAAAQ",
        "AAAAAQAAAAAAAAAAAAAAB1Jlc3VsdHMAAAAAAgAAAAAAAAAHb3B0aW9ucwAAAAPqAAAD7QAAAAIAAAAQAAAABAAAAAAAAAAIcXVlc3Rpb24AAAAQ",
        "AAAAAQAAAAAAAAAAAAAAClBvbGxPcHRpb24AAAAAAAIAAAAAAAAABHRleHQAAAAQAAAAAAAAAAV2b3RlcwAAAAAAAAQ=",
        "AAAAAAAAAAAAAAAEdm90ZQAAAAIAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAAMb3B0aW9uX2luZGV4AAAABAAAAAA=",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAIcXVlc3Rpb24AAAAQAAAAAAAAAAdvcHRpb25zAAAAA+oAAAAQAAAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X3Jlc3VsdHMAAAAAAAAAAAEAAAfQAAAAB1Jlc3VsdHMA" ]),
      options
    )
  }
  public readonly fromJSON = {
    vote: this.txFromJSON<null>,
        initialize: this.txFromJSON<null>,
        get_results: this.txFromJSON<Results>
  }
}