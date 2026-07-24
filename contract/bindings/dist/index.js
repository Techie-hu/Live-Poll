import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
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
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAAAAAAAAAAAAABFBvbGwAAAACAAAAAAAAAAdvcHRpb25zAAAAA+oAAAfQAAAAClBvbGxPcHRpb24AAAAAAAAAAAAIcXVlc3Rpb24AAAAQ",
            "AAAAAQAAAAAAAAAAAAAAB1Jlc3VsdHMAAAAAAgAAAAAAAAAHb3B0aW9ucwAAAAPqAAAD7QAAAAIAAAAQAAAABAAAAAAAAAAIcXVlc3Rpb24AAAAQ",
            "AAAAAQAAAAAAAAAAAAAAClBvbGxPcHRpb24AAAAAAAIAAAAAAAAABHRleHQAAAAQAAAAAAAAAAV2b3RlcwAAAAAAAAQ=",
            "AAAAAAAAAAAAAAAEdm90ZQAAAAIAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAAMb3B0aW9uX2luZGV4AAAABAAAAAA=",
            "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAIcXVlc3Rpb24AAAAQAAAAAAAAAAdvcHRpb25zAAAAA+oAAAAQAAAAAA==",
            "AAAAAAAAAAAAAAALZ2V0X3Jlc3VsdHMAAAAAAAAAAAEAAAfQAAAAB1Jlc3VsdHMA"]), options);
        this.options = options;
    }
    fromJSON = {
        vote: (this.txFromJSON),
        initialize: (this.txFromJSON),
        get_results: (this.txFromJSON)
    };
}
