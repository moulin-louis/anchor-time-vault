
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useProgram } from "./ProgramProvider"
import { Program, utils } from "@coral-xyz/anchor"
import type { TimeVaultLock } from "./idl/idl"
import { useEffect, useState } from "react"
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

const checkVaultInit = async (userPubkey: PublicKey, program: Program<TimeVaultLock>): Promise<boolean> => {
  const [vaultPublicKey] = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("timevault"), userPubkey.toBuffer()],
    program.programId,
  )
  try {
    await program.account.vault.fetch(vaultPublicKey)
    return true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false
  }
}

const formSchema = z.object({
  amount: z.string().refine(
    (val) => {
      try {
        const x = BigInt(val)
        return x > BigInt(0)
      } catch {
        return false
      }
    },
    { message: "Amount must be a positive number" },
  ),
  end_date: z.date().min(new Date(), "The date must be in the future"),
})

type FormValues = z.infer<typeof formSchema>

const InitVault = () => {
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
    // For example: await program.methods.initializeVault(new BN(values.amount), new BN(diffTime)).rpc()

    toast({
      title: "Vault Initialized",
      description: `Amount: ${values.amount} SOL, Unlock date: ${format(values.end_date, "PPpp")}`,
    })
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

export const ProgramLogic = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isVaultInit, setIsVaultInit] = useState(false)
  const wallet = useAnchorWallet()
  const program = useProgram()

  useEffect(() => {
    const checkInit = async () => {
      if (!wallet || !program) return
      const isInit = await checkVaultInit(wallet.publicKey, program)
      setIsVaultInit(isInit)
      setIsLoading(false)
    }

    checkInit()
  }, [wallet, program])

  if (isLoading) {
    return <Skeleton className="w-[100px] h-[20px] rounded-full" />
  }

  return isVaultInit ? <div>Vault is initialized</div> : <InitVault />
}


