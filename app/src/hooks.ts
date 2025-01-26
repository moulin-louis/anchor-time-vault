import { Program } from "@coral-xyz/anchor";
import { createContext, useContext } from "react";
import { TimeVaultLock } from "./idl/idl";

export const ProgramAnchorContext =
  createContext<Program<TimeVaultLock> | null>(null);

export const useProgram = () => {
  return useContext(ProgramAnchorContext);
};
