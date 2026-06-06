"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeCanvas } from "qrcode.react";
import { Upload, CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface RegisteredProduct {
  id: number;
  name: string;
  manufacturer: string;
  description: string;
  price: number;
  blockchainProductId: string;
  image?: string;
}

export default function RegisterProductPage() {
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [products, setProducts] = useState<RegisteredProduct[]>([]);
  const [productImage, setProductImage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.company_name) {
        setManufacturer(user.user_metadata.company_name);
      }
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMsg("Only image files are allowed (PNG, JPG, WEBP).");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus("error");
      setErrorMsg("Image must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }
    setStatus("idle");
    const reader = new FileReader();
    reader.onloadend = () => setProductImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("verifying");
    setErrorMsg("");

    try {
      // Get session first so we can pass the auth token to the API
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      // 1. Register on blockchain via server-side API (private key stays server-side)
      const res = await fetch("/api/register-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ name, description, location, price: Number(price) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Blockchain transaction failed.");

      const blockchainProductId = data.blockchainProductId;
      setTxHash(data.txHash ?? null);

      // 2. Upload image to Supabase Storage (if provided)
      let imageUrl = "";
      if (productImage) {
        const blob = await fetch(productImage).then((r) => r.blob());
        const ext = blob.type.split("/")[1] || "jpg";
        const path = `${user?.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(path, blob, { contentType: blob.type });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      // 3. Save display metadata to Supabase
      const { error: dbError } = await supabase.from("products").insert({
        product_name: name,
        manufacturer,
        description,
        location,
        price: Number(price),
        quantity: 0,
        is_published: false,
        blockchain_product_id: blockchainProductId,
        user_id: user?.id ?? null,
        image_url: imageUrl || null,
        tx_hash: data.txHash ?? null,
      });

      if (dbError) {
        // Blockchain succeeded but DB save failed — most likely missing columns.
        // Surface the error so the user knows to run the Supabase migration SQL.
        setStatus("error");
        setErrorMsg(`Blockchain registration succeeded (ID: ${blockchainProductId}) but database save failed: ${dbError.message}. Run the Supabase SQL migration to add the location and tx_hash columns, then try again.`);
        return;
      }

      // 4. Update local session preview
      setProducts((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          name,
          manufacturer,
          description,
          price: Number(price),
          blockchainProductId,
          image: productImage || undefined,
        },
      ]);

      setStatus("verified");
      setName("");
      setManufacturer(user?.user_metadata?.company_name ?? "");
      setDescription("");
      setLocation("");
      setPrice("");
      setProductImage(null);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Blockchain transaction failed.");
    }
  };

  const inputClass =
    "w-full rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition";

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
          Register Product
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Register and verify your product on the blockchain
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none p-8">
        {/* Status Banners */}
        {status === "verifying" && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/[0.08] text-amber-700 dark:text-amber-400 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            Verifying product on blockchain...
          </div>
        )}
        {status === "verified" && (
          <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span>Product registered on blockchain and saved successfully.</span>
              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline underline-offset-2 hover:opacity-70 transition"
                >
                  View on Etherscan →
                </a>
              )}
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/25 bg-red-50 dark:bg-red-500/[0.08] text-red-700 dark:text-red-400 text-sm font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT — form fields */}
          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Name
              </label>
              <input
                className={inputClass}
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Manufacturer
              </label>
              <input
                className={inputClass}
                placeholder="Company / manufacturer name"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Describe your product"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <input
                className={inputClass}
                placeholder="e.g. Kuala Lumpur, Malaysia"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Price (RM)
              </label>
              <input
                type="number"
                className={inputClass}
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* RIGHT — image upload */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Image
            </label>
            <div className="border-2 border-dashed border-gray-200 dark:border-white/15 rounded-2xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500/50 transition bg-gray-50 dark:bg-white/[0.02] min-h-[220px] flex flex-col items-center justify-center">
              {productImage ? (
                <img
                  src={productImage}
                  alt="Preview"
                  className="mx-auto max-h-44 rounded-xl object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Upload product image
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                      PNG, JPG, WEBP supported
                    </p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-4 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border file:border-gray-200 dark:file:border-white/10 file:text-xs file:font-medium file:bg-white dark:file:bg-white/[0.06] file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-50 dark:hover:file:bg-white/[0.1] file:transition cursor-pointer"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={status === "verifying"}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "verifying" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying on Blockchain...
                </>
              ) : (
                "Register & Verify Product"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Session preview — registered products */}
      {products.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Registered in this Session
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none overflow-hidden"
              >
                {p.image && (
                  <img src={p.image} alt={p.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex-shrink-0 ml-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      On-Chain
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{p.manufacturer}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{p.description}</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400 mb-1">RM {p.price}</p>

                  <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-3 font-mono">
                    Blockchain ID: #{p.blockchainProductId}
                  </p>

                  {/* QR encodes the blockchain product ID — scan to verify on-chain */}
                  <div className="bg-white p-3 rounded-xl border border-gray-100 dark:border-white/10 inline-block">
                    <QRCodeCanvas value={p.blockchainProductId} size={110} />
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2">
                    QR encodes blockchain product ID for on-chain verification
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
