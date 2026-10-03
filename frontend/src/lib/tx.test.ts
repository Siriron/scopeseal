import { describe, expect, it, vi, beforeEach } from "vitest";

// ---- fakes for the wallet/RPC layer; contracts.ts and client.ts logic is the real code
const fake = {
  writeContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  readContract: vi.fn(),
};

vi.mock("genlayer-js", () => ({
  createClient: () => ({
    writeContract: (a: any) => fake.writeContract(a),
    waitForTransactionReceipt: (a: any) => fake.waitForTransactionReceipt(a),
    readContract: (a: any) => fake.readContract(a),
  }),
}));
vi.mock("genlayer-js/chains", () => ({ studionet: {} }));
vi.mock("genlayer-js/types", () => ({ TransactionStatus: {} }));

import { TxFailure, asSubmitError, classifyReceipt, waitForReceipt } from "./client";
import { checkCompliance, declareRelease } from "./contracts";
import { toErrorView } from "./errors";
import { isValidPackageName, isValidVersion } from "./validation";

const WALLET = "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa";
const PKG = "left-pad";
const VER = "1.3.0";

const accepted = { statusName: "ACCEPTED", resultName: "AGREE", txExecutionResultName: "FINISHED_WITH_RETURN" };

function decl(over: Record<string, unknown> = {}) {
  return {
    declaration_id: 7,
    package_name: PKG,
    version: VER,
    declarer: WALLET.toLowerCase(),
    declared_allow_lifecycle_scripts: false,
    declared_max_dependency_count: 5,
    declared_allow_platform_restriction: false,
    status: "declared",
    verdict: "",
    ...over,
  };
}

// route view reads by function name
function routeReads(map: Record<string, unknown | (() => unknown)>) {
  fake.readContract.mockImplementation(async ({ functionName }: any) => {
    const v = map[functionName];
    if (v === undefined) throw new Error(`unexpected read ${functionName}`);
    return JSON.stringify(typeof v === "function" ? (v as () => unknown)() : v);
  });
}

beforeEach(() => {
  fake.writeContract.mockReset();
  fake.waitForTransactionReceipt.mockReset();
  fake.readContract.mockReset();
  (globalThis as any).window = { ethereum: undefined };
});

describe("classifyReceipt", () => {
  it("accepts an accepted, successfully executed transaction", () => {
    expect(() => classifyReceipt(accepted, "0x1")).not.toThrow();
    expect(() => classifyReceipt({ ...accepted, statusName: "FINALIZED" }, "0x1")).not.toThrow();
  });

  it("flags a contract revert", () => {
    const tx = { statusName: "ACCEPTED", txExecutionResultName: "FINISHED_WITH_ERROR", consensus_data: { leader_receipt: [{ error: "wrong state" }] } };
    try {
      classifyReceipt(tx, "0xabc");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(TxFailure);
      expect((e as TxFailure).kind).toBe("reverted");
      expect((e as TxFailure).message).toContain("wrong state");
      expect((e as TxFailure).txHash).toBe("0xabc");
    }
  });

  it.each(["UNDETERMINED", "CANCELED"])("flags %s as rejected by validators", (statusName) => {
    expect(() => classifyReceipt({ statusName }, "0x1")).toThrowError(expect.objectContaining({ kind: "consensus_rejected" }));
  });

  it("flags a disagreeing consensus result as rejected by validators", () => {
    expect(() => classifyReceipt({ statusName: "ACCEPTED", resultName: "MAJORITY_DISAGREE" }, "0x1")).toThrowError(
      expect.objectContaining({ kind: "consensus_rejected" })
    );
  });

  it.each(["LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"])("flags %s as timed out", (statusName) => {
    expect(() => classifyReceipt({ statusName }, "0x1")).toThrowError(expect.objectContaining({ kind: "timed_out" }));
  });
});

describe("asSubmitError", () => {
  it.each([{ code: 4001 }, { code: "ACTION_REJECTED" }, { message: "User rejected the request." }])(
    "maps a wallet rejection %j",
    (err) => {
      const out = asSubmitError(err);
      expect(out).toBeInstanceOf(TxFailure);
      expect((out as TxFailure).kind).toBe("wallet_rejected");
    }
  );
  it("passes other errors through", () => {
    const out = asSubmitError(new Error("boom"));
    expect(out).not.toBeInstanceOf(TxFailure);
    expect(out.message).toBe("boom");
  });
});

describe("waitForReceipt", () => {
  it("turns a polling timeout into a timed_out failure that keeps the tx hash", async () => {
    fake.waitForTransactionReceipt.mockRejectedValue(new Error("Timed out waiting for transaction"));
    await expect(waitForReceipt({ waitForTransactionReceipt: fake.waitForTransactionReceipt }, "0xfeed")).rejects.toMatchObject({
      kind: "timed_out",
      txHash: "0xfeed",
    });
  });
  it("resolves for an accepted receipt", async () => {
    fake.waitForTransactionReceipt.mockResolvedValue(accepted);
    await expect(waitForReceipt({ waitForTransactionReceipt: fake.waitForTransactionReceipt }, "0x1")).resolves.toBeUndefined();
  });
});

describe("declareRelease", () => {
  const args = [WALLET, PKG, VER, false, 5, false] as const;

  it("returns the id read back from the contract and verifies it", async () => {
    fake.writeContract.mockResolvedValue("0x1");
    fake.waitForTransactionReceipt.mockResolvedValue(accepted);
    routeReads({ get_declaration_id: { declaration_id: 7 }, get_declaration: decl() });
    const res = await declareRelease(...args);
    expect(res.declaration.declaration_id).toBe(7);
    expect(res.hash).toBe("0x1");
    // the id came from get_declaration_id(package, version), never from a counter
    const names = fake.readContract.mock.calls.map((c) => c[0].functionName);
    expect(names).toContain("get_declaration_id");
    expect(names).not.toContain("get_next_declaration_id");
  });

  it("surfaces a revert and never reads a declaration", async () => {
    fake.writeContract.mockResolvedValue("0x2");
    fake.waitForTransactionReceipt.mockResolvedValue({
      statusName: "ACCEPTED",
      txExecutionResultName: "FINISHED_WITH_ERROR",
      consensus_data: { leader_receipt: [{ error: "version already declared" }] },
    });
    await expect(declareRelease(...args)).rejects.toMatchObject({ kind: "reverted" });
    expect(fake.readContract).not.toHaveBeenCalled();
  });

  it("surfaces a wallet rejection and never waits for a receipt", async () => {
    fake.writeContract.mockRejectedValue({ code: 4001, message: "User rejected the request." });
    await expect(declareRelease(...args)).rejects.toMatchObject({ kind: "wallet_rejected" });
    expect(fake.waitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it("surfaces validator rejection", async () => {
    fake.writeContract.mockResolvedValue("0x3");
    fake.waitForTransactionReceipt.mockResolvedValue({ statusName: "UNDETERMINED" });
    await expect(declareRelease(...args)).rejects.toMatchObject({ kind: "consensus_rejected", txHash: "0x3" });
  });

  it("surfaces a consensus timeout", async () => {
    fake.writeContract.mockResolvedValue("0x4");
    fake.waitForTransactionReceipt.mockRejectedValue(new Error("Timed out"));
    await expect(declareRelease(...args)).rejects.toMatchObject({ kind: "timed_out", txHash: "0x4" });
  });

  it("refuses a stored declaration that is not the one submitted", async () => {
    fake.writeContract.mockResolvedValue("0x5");
    fake.waitForTransactionReceipt.mockResolvedValue(accepted);
    routeReads({ get_declaration_id: { declaration_id: 7 }, get_declaration: decl({ declared_max_dependency_count: 99 }) });
    await expect(declareRelease(...args)).rejects.toThrow(/does not match what was submitted/);
  });

  it("refuses a declaration made by another wallet", async () => {
    fake.writeContract.mockResolvedValue("0x6");
    fake.waitForTransactionReceipt.mockResolvedValue(accepted);
    routeReads({ get_declaration_id: { declaration_id: 7 }, get_declaration: decl({ declarer: "0x" + "bb".repeat(20) }) });
    await expect(declareRelease(...args)).rejects.toThrow(/does not match what was submitted/);
  });
});

describe("checkCompliance", () => {
  const shown = { declarationId: 7, packageName: PKG, version: VER };

  it("re-reads the declaration after acceptance and returns the checked state", async () => {
    fake.writeContract.mockResolvedValue("0x10");
    fake.waitForTransactionReceipt.mockResolvedValue(accepted);
    routeReads({ get_declaration: decl({ status: "checked", verdict: "COMPLIANT" }) });
    const res = await checkCompliance(WALLET, shown);
    expect(res.declaration.status).toBe("checked");
    expect(fake.writeContract.mock.calls[0][0].args).toEqual([7]);
  });

  it("fails if the on-chain declaration is not the package@version that was displayed", async () => {
    fake.writeContract.mockResolvedValue("0x11");
    fake.waitForTransactionReceipt.mockResolvedValue(accepted);
    routeReads({ get_declaration: decl({ version: "9.9.9", status: "checked", verdict: "COMPLIANT" }) });
    await expect(checkCompliance(WALLET, shown)).rejects.toThrow(/not the package and version that was displayed/);
  });

  it("reports a revert without claiming a verdict", async () => {
    fake.writeContract.mockResolvedValue("0x12");
    fake.waitForTransactionReceipt.mockResolvedValue({ txExecutionResultName: "FINISHED_WITH_ERROR", statusName: "ACCEPTED" });
    await expect(checkCompliance(WALLET, shown)).rejects.toMatchObject({ kind: "reverted" });
    expect(fake.readContract).not.toHaveBeenCalled();
  });

  it("reports validator timeout with the tx hash", async () => {
    fake.writeContract.mockResolvedValue("0x13");
    fake.waitForTransactionReceipt.mockRejectedValue(new Error("Timed out"));
    await expect(checkCompliance(WALLET, shown)).rejects.toMatchObject({ kind: "timed_out", txHash: "0x13" });
  });
});

describe("toErrorView", () => {
  it("keeps the kind and hash of a TxFailure", () => {
    expect(toErrorView(new TxFailure("timed_out", "slow", "0x9"), "x")).toEqual({ kind: "timed_out", message: "slow", txHash: "0x9" });
  });
  it("falls back for unknown throwables", () => {
    expect(toErrorView("weird", "fallback")).toEqual({ kind: "error", message: "fallback" });
  });
});

describe("input validation mirrors the contract", () => {
  it.each(["left-pad", "@scope/pkg", "a.b_c-d~e"])("accepts %s", (n) => expect(isValidPackageName(n)).toBe(true));
  it.each(["Upper", "a/b", "x?y", "x#y", "a b", ".x", "_x", "@scope", "@a/b/c", ""])("rejects %j", (n) => expect(isValidPackageName(n)).toBe(false));
  it.each(["1.3.0", "1.0.0-beta.1", "2.0.0+build"])("accepts version %s", (v) => expect(isValidVersion(v)).toBe(true));
  it.each(["", "1", "latest", "1.0.0/..", "1.0.0?x"])("rejects version %j", (v) => expect(isValidVersion(v)).toBe(false));
});
