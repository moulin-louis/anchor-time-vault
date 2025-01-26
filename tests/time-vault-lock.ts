import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TimeVaultLock } from "../target/types/time_vault_lock";
import { assert, beforeAll, describe, expect, it } from "vitest";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export const waitForTransaction = async (
  connection: Connection,
  tx: string
) => {
  const latestblock = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction({
    ...latestblock,
    signature: tx,
  });
};

describe("time-vault-lock", () => {
  // Configure the client to use the local cluster.
  const tmp = anchor.AnchorProvider.env();
  //tmp.opts.skipPreflight = true;
  anchor.setProvider(tmp);
  const provider = anchor.getProvider();

  const program = anchor.workspace.TimeVaultLock as Program<TimeVaultLock>;

  it("Is initialized!", async () => {
    const user = Keypair.generate();
    const tx = await provider.connection.requestAirdrop(
      user.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await waitForTransaction(provider.connection, tx);

    await program.methods
      .initialize(new anchor.BN(42), new anchor.BN(42))
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc();
    console.log("Vault init");
  });
  it("Successfull unlock", async () => {
    const user = Keypair.generate();
    const tx = await provider.connection.requestAirdrop(
      user.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await waitForTransaction(provider.connection, tx);

    await program.methods
      .initialize(new anchor.BN(1), new anchor.BN(42))
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc();
    console.log("Vault init");
    await sleep(1500); //wait 1.5 secs

    await program.methods
      .unlock()
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc();

    console.log("Fund unlocked and transfered back");
  });

  it("Failed unlock", async () => {
    const user = Keypair.generate();
    const tx = await provider.connection.requestAirdrop(
      user.publicKey,
      10 * LAMPORTS_PER_SOL
    );

    await waitForTransaction(provider.connection, tx);

    await program.methods
      .initialize(new anchor.BN(4200000), new anchor.BN(42))
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc();
    console.log("Vault init");
    //try {
    //  const tx = await program.methods
    //    .unlock()
    //    .accounts({
    //      user: user.publicKey,
    //    })
    //    .signers([user])
    //    .rpc();
    //} catch (e) {
    //  console.error("e = ", e);
    //}

    expect(
      program.methods
        .unlock()
        .accounts({
          user: user.publicKey,
        })
        .signers([user])
        .rpc()
    ).rejects.toThrow(
      "AnchorError occurred. Error Code: NotReached. Error Number: 6000. Error Message: Time Lock Not Reached."
    );
  });
});
