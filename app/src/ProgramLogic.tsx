
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { useProgram } from "./ProgramProvider"
import { BN, Program, utils } from "@coral-xyz/anchor"
import type { TimeVaultLock } from "./idl/idl"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "./hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card"

type VaultInfo = {
  startClock: BN;
  endClock: BN;
  nbrLamports: BN;
  bump: number;
}

const checkVaultInit = async (userPubkey: PublicKey, program: Program<TimeVaultLock>): Promise<boolean> => {
  const [vaultPublicKey] = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("time-vault"), userPubkey.toBuffer()],
    program.programId,
  )
  try {
    await program.account.vault.fetch(vaultPublicKey)
    return true
  } catch (e) {
    console.log('error = ', e)
    return false
  }
}

const InitVault = ({ setIsVaultInit }: { setIsVaultInit: Dispatch<SetStateAction<boolean>> }) => {
  const formSchema = z.object({
    amount: z.string().refine(
      (val) => {
        try {
          const valLamports = Number(val) * LAMPORTS_PER_SOL;
          return new BN(valLamports) > new BN(0)
        } catch {
          return false
        }
      },
      { message: "Amount must be a positive number2" },
    ),
    end_date: z.date().min(new Date(), "The date must be in the future"),
  })

  type FormValues = z.infer<typeof formSchema>
  const program = useProgram();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "1",
      end_date: new Date(),
    },
  })

  const onInit = async (values: FormValues) => {
    const endDateTime = new Date(values.end_date)
    const diffTime = Math.abs(endDateTime.getTime() - new Date().getTime())
    console.log(`Time difference: ${diffTime} ms`)
    console.log("Form values:", values)

    // Here you would typically call your program's initialization function
    try {
      const tx = await program?.methods.initialize(new BN(diffTime / 1000), new BN(Number(values.amount) * LAMPORTS_PER_SOL)).rpc();
      console.log('tx init hash = ', tx);
      setIsVaultInit(true);
      toast({
        title: "Vault Initialized",
        description: `Amount: ${values.amount} SOL, Unlock date: ${format(values.end_date, "PPpp")}`,
      });
    } catch (e) {
      const error = e as Error;
      console.error('failed to init vault: ', error);
      toast({
        title: "Failed to init vault",
        description: `error: ${error.name}`,
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onInit)} className="space-y-8">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (SOL)</FormLabel>
              <FormControl>
                <Input type="number" step="0.000000001" min="0" placeholder="1" {...field} />
              </FormControl>
              <FormDescription>The amount of SOL to lock in the vault.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Unlock Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPpp") : <span>Pick a date and time</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    disabled={(date) => date <= new Date()}
                    onTimeChange={field.onChange}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>The date and time when the vault will unlock.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Initialize Vault</Button>
      </form>
    </Form>
  )
}

const VaultInfo = ({ vault, setIsVaultInit }: { vault: VaultInfo } & { setIsVaultInit: Dispatch<SetStateAction<boolean>> }) => {
  const program = useProgram();
  useEffect(() => {
    console.log('vault lamports = ', vault.nbrLamports.toString())
  }, [vault.nbrLamports])

  console.log('vault start clock = ', vault.startClock.toString())
  const solAmount = Number(vault.nbrLamports.toString()) / LAMPORTS_PER_SOL;

  const endDate = new Date(Number(vault.startClock.toString()) * 1000 + Number(vault.endClock.toString()))
  console.log('endDate = ', endDate);

  const onClickUnlock = async () => {
    if (!program)
      throw new Error("program is undefined")
    const tx = await program?.methods.unlock().rpc();
    console.log('unlock tx hash = ', tx);
    console.log('sol unlocked');
    setIsVaultInit(false);
    toast({
      title: "Success",
      description: `${solAmount} $SOL unlocked to ${program.provider.publicKey}`
    })
  }

  return (<Card>
    <CardHeader>
      <CardTitle>
        Vault
      </CardTitle>
      <CardDescription>
        Unlock in {vault.endClock.toString()} ms
      </CardDescription>
    </CardHeader>
    <CardContent>
      {solAmount} $SOL lock till {format(endDate, "PPpp")}
    </CardContent>
    <CardFooter>
      <Button onClick={onClickUnlock}>
        Unlock
      </Button>

    </CardFooter>
  </Card>)
}


const UnlockVault = ({ setIsVaultInit }: { setIsVaultInit: Dispatch<SetStateAction<boolean>> }) => {
  const program = useProgram();
  const [vault, setVault] = useState<undefined | VaultInfo>(undefined);

  useEffect(() => {
    const x = async () => {
      if (!program || !program.provider.publicKey)
        throw new Error("program or wallet is null")
      const [vaultPublicKey] = PublicKey.findProgramAddressSync(
        [utils.bytes.utf8.encode("time-vault"), program.provider.publicKey.toBuffer()],
        program.programId,
      )
      const vaultFetch = await program.account.vault.fetch(vaultPublicKey)
      setVault(vaultFetch);
    }
    x();
  }, [program])
  if (vault === undefined)
    return <Skeleton className="w-[100px] h-[20px] rounded-full" />
  return (
    <VaultInfo vault={vault} setIsVaultInit={setIsVaultInit} />
  )
}

export const ProgramLogic = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isVaultInit, setIsVaultInit] = useState(false)
  const program = useProgram()

  useEffect(() => {
    const checkInit = async () => {
      if (!program || !program.provider.publicKey)
        return;
      const isInit = await checkVaultInit(program.provider.publicKey, program)
      setIsVaultInit(isInit)
      setIsLoading(false)
    }

    checkInit()
  }, [program])

  if (isLoading) {
    return <Skeleton className="w-[100px] h-[20px] rounded-full" />
  }

  return isVaultInit ? <UnlockVault setIsVaultInit={setIsVaultInit} /> : <InitVault setIsVaultInit={setIsVaultInit} />
}


