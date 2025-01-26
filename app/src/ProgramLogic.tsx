import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useProgram } from "./ProgramProvider"
import { type Program, utils } from "@coral-xyz/anchor"
import type { TimeVaultLock } from "./idl/idl"
import { useEffect, useState } from "react"
import { Skeleton } from "./components/ui/skeleton"
import { Button } from "./components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./components/ui/form"
import { Input } from "./components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover"
import { cn } from "./lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./components/ui/calendar"

const checkVaultInit = async (userPubkey: PublicKey, program: Program<TimeVaultLock>): Promise<boolean> => {
  const [vaultPublicKey] = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("timevault"), userPubkey.toBuffer()],
    program.programId,
  )
  console.log("vault pubKey = ", vaultPublicKey)
  try {
    //will throw is vault isnt init
    await program.account.vault.fetch(vaultPublicKey)
    console.log("vault already init")
    return true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.log("vault isnt init")
    return false
  }
}

const InitVault = () => {
  const formSchema = z.object({
    amount: z.string().refine(
      (val) => {
        try {
          const x = BigInt(val)
          if (x <= BigInt(0)) throw new Error("Big init must be positive")
          return true
        } catch {
          return false
        }
      },
      { message: "Invalid BigInt value" },
    ),
    end_date: z.date().min(new Date(), "The date must be in the future..."),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "1",
      end_date: new Date(),
    },
  })

  const onInit = async (values: z.infer<typeof formSchema>) => {
    const endDateTime = new Date(values.end_date)
    const diffTime = Math.abs(endDateTime.getTime() - new Date().getTime())
    console.log(`diff = ${diffTime} ms`)
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onInit)} className="space-y-8">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>The amount of $SOL to lock.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "Pp")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Your date of birth is used to calculate your age.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
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

  return isVaultInit ? <div>Vault init</div> : <InitVault />
}


