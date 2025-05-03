import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useContractWrite } from 'wagmi' // Correct hook usage
import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbi } from 'viem'

// Define the chain (somnia testnet)
const somniaChain = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: { name: 'Somnia Testnet Token', symbol: 'STT', decimals: 18 },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
}

// Contract ABI and Address
const CONTRACT_ADDRESS = '0xb8359c043bE884a1E934f03B771F30B2ae716759'
const CONTRACT_ABI = parseAbi([
  'function gm() public',
  'event GM(address indexed sender, uint256 timestamp)',
])

// Create a client instance for interacting with the blockchain (viem)
const client = createPublicClient({
  chain: somniaChain,
  transport: http('https://dream-rpc.somnia.network'),
})

export default function Home() {
  const { isConnected } = useAccount()

  // Correct usage of useContractWrite for wagmi v2.x
  const { write, isLoading } = useContractWrite({
    addressOrName: CONTRACT_ADDRESS,  // Correctly use addressOrName
    contractInterface: CONTRACT_ABI,   // Correctly use contractInterface
    functionName: 'gm',               // Call the gm function
  })

  const [gms, setGms] = useState<{ sender: string; timestamp: bigint }[]>([])

  const handleGm = async () => {
    try {
      // Call the contract function
      await write?.() // Ensure write is called correctly
      alert('gm sent!')
    } catch (err) {
      console.error(err)
      alert('gm failed!')
    }
  }

  useEffect(() => {
    async function fetchGMs() {
      // Fetch logs from the contract
      const logs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        event: CONTRACT_ABI[1],
        fromBlock: BigInt(0),
      })

      // Parse and set the logs
      const parsed = logs.map(log => ({
        sender: log.args.sender as string,
        timestamp: log.args.timestamp as bigint,
      }))

      setGms(parsed.reverse()) // reverse to show latest first
    }

    fetchGMs()
  }, [])

  return (
    <main className="p-8 text-center">
      <h1 className="text-3xl font-bold">gm on chain 🌞</h1>
      <ConnectButton />
      {isConnected && (
        <button
          onClick={handleGm}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={isLoading} // Disabled when transaction is pending
        >
          {isLoading ? 'Sending...' : 'Send gm'}
        </button>
      )}
      <h2 className="text-xl font-semibold mt-8">Latest gms</h2>
      <ul className="mt-4 space-y-2">
        {gms.map((gm, idx) => (
          <li key={idx}>
            👤 {gm.sender} at {new Date(Number(gm.timestamp) * 1000).toLocaleString()}
          </li>
        ))}
      </ul>
    </main>
  )
}
