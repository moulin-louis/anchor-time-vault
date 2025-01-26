import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { ProgramAnchorProvider } from "./ProgramProvider";
import { ProgramLogic } from "./ProgramLogic";

const Header = () => {
  return (
    <header className="w-full flex justify-end">
      <div className=" m-4 mt-2 mr-3">
        <WalletMultiButton />
      </div>
    </header>

  )
}


const App = () => {
  //const endpoint = clusterApiUrl("devnet");
  const endpoint = "http://localhost:8899";

  return (
    <div className="min-h-screen bg-gray-300">
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <ProgramAnchorProvider>
              <div className="p-4">
                <Header />
                <ProgramLogic />
              </div>
            </ProgramAnchorProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

export default App;
