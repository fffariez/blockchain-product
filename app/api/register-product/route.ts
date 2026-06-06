import { NextRequest, NextResponse } from "next/server";
import Web3 from "web3";
import ProductRegistryJson from "@/contracts/ProductRegistry.json";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.slice(7)
    );
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, location, price } = await req.json();

    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      return NextResponse.json(
        { error: "Blockchain environment variables not configured." },
        { status: 500 }
      );
    }

    const web3 = new Web3(rpcUrl);

    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

    const account = web3.eth.accounts.privateKeyToAccount(formattedKey);
    web3.eth.accounts.wallet.add(account);

    const contract = new web3.eth.Contract(
      (ProductRegistryJson as any).abi,
      contractAddress
    );

    const tx = await contract.methods
      .registerProduct(name, description, location ?? "", Math.round(Number(price)))
      .send({ from: account.address, gas: "300000" });

    const eventId =
      (tx as any).events?.ProductRegistered?.returnValues?.id ??
      (tx as any).events?.ProductRegistered?.returnValues?.[0];

    const blockchainProductId =
      eventId !== undefined ? String(eventId) : String(Date.now());

    return NextResponse.json({
      blockchainProductId,
      txHash: (tx.transactionHash as string) ?? null,
    });
  } catch (err: any) {
    console.error("Blockchain registration error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Blockchain transaction failed." },
      { status: 500 }
    );
  }
}
