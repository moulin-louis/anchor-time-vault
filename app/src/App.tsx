import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  AnchorWallet,
  ConnectionProvider,
  useConnection,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

// Default styles that can be overridden by your app
import { ReactNode } from "react";
import IDL from './idl/idl.json'

import TransactionTest from "./TransactionTest";
import { clusterApiUrl, } from "@solana/web3.js";

import './App.css'
import { ProgramAnchorContext } from "./hooks";
import { TimeVaultLock } from "./idl/idl";


function ProgramAnchorProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const connectionState = useConnection();
  if (wallet.connected === false) {
    return (<>
      <ProgramAnchorContext.Provider value={null}>
        {children}
      </ProgramAnchorContext.Provider >
    </>)
  }
  console.log('connection - ', connectionState.connection,)
  const provider = new AnchorProvider(connectionState.connection, wallet as AnchorWallet, {
    commitment: 'confirmed'
  })
  const program = new Program<TimeVaultLock>(IDL as TimeVaultLock, provider);
  return (
    <ProgramAnchorContext.Provider value={program}>
      {children}
    </ProgramAnchorContext.Provider>
  )

}

function App() {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  // You can also provide a custom RPC endpoint.
  const endpoint = clusterApiUrl("devnet");

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
          <ProgramAnchorProvider>
            <TransactionTest />
          </ProgramAnchorProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
