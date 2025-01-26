import { useAnchorWallet, useConnection, } from "@solana/wallet-adapter-react";
import { createContext, ReactNode, useContext } from "react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { TimeVaultLock } from "./idl/idl";
import IDL from './idl/idl.json'


const ProgramAnchorContext =
  createContext<Program<TimeVaultLock> | null>(null);

export const useProgram = () => {
  return useContext(ProgramAnchorContext);
};

export function ProgramAnchorProvider({ children }: { children: ReactNode }) {
  const wallet = useAnchorWallet()
  const connectionState = useConnection();
  if (!wallet) {
    return (<>
      <ProgramAnchorContext.Provider value={null}>
        {children}
      </ProgramAnchorContext.Provider >
    </>)
  }
  const provider = new AnchorProvider(connectionState.connection, wallet, {
    commitment: 'confirmed'
  })
  const program = new Program<TimeVaultLock>(IDL as TimeVaultLock, provider);
  return (
    <ProgramAnchorContext.Provider value={program}>
      {children}
    </ProgramAnchorContext.Provider>
  )

}
