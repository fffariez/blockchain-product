import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
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

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(formattedKey, provider);

    const contract = new ethers.Contract(
      contractAddress,
      (ProductRegistryJson as any).abi,
      wallet
    );

    const tx = await contract.registerProduct(
      name,
      description,
      location ?? "",
      Math.round(Number(price))
    );

    const receipt = await tx.wait();

    // Parse ProductRegistered event to get the on-chain product ID
    let blockchainProductId: string = String(Date.now());
    const iface = new ethers.Interface((ProductRegistryJson as any).abi);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "ProductRegistered") {
          blockchainProductId = String(parsed.args[0]);
          break;
        }
      } catch {
        // skip logs that don't match
      }
    }

    return NextResponse.json({
      blockchainProductId,
      txHash: receipt.hash ?? null,
    });
  } catch (err: any) {
    console.error("Blockchain registration error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Blockchain transaction failed." },
      { status: 500 }
    );
  }
}
