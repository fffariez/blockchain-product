"use client";

import { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { X, Download, Boxes, Loader2, AlertCircle, Search, Trash2 } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  price: number;
  quantity: number;
  blockchainProductId: string;
  createdAt: string;
  imageUrl: string;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editManufacturer, setEditManufacturer] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("products")
      .select("id, product_name, manufacturer, description, price, quantity, blockchain_product_id, created_at, image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Failed to load products:", error.message);

    setProducts(
      (data ?? []).map((p) => ({
        id: p.id,
        name: p.product_name,
        manufacturer: p.manufacturer,
        description: p.description ?? "",
        price: p.price ?? 0,
        quantity: p.quantity ?? 0,
        blockchainProductId: p.blockchain_product_id ?? "",
        createdAt: p.created_at,
        imageUrl: p.image_url ?? "",
      }))
    );

    setLoading(false);
  };

  const updateQuantity = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
      )
    );
    if (selectedProduct?.id === id) {
      setSelectedProduct((prev) =>
        prev ? { ...prev, quantity: Math.max(0, prev.quantity + delta) } : prev
      );
    }
  };

  const saveProduct = async (product: Product) => {
    setSavingId(product.id);
    setSaveError(null);
    const { error } = await supabase
      .from("products")
      .update({ quantity: product.quantity })
      .eq("id", product.id);
    if (error) setSaveError(`Failed to save: ${error.message}`);
    setSavingId(null);
  };

  const openEdit = (product: Product) => {
    setEditName(product.name);
    setEditManufacturer(product.manufacturer);
    setEditDescription(product.description);
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!selectedProduct) return;
    setSavingEdit(true);
    setSaveError(null);
    const { error } = await supabase
      .from("products")
      .update({ product_name: editName, manufacturer: editManufacturer, description: editDescription })
      .eq("id", selectedProduct.id);
    if (error) {
      setSaveError(`Edit failed: ${error.message}`);
    } else {
      const updated = { ...selectedProduct, name: editName, manufacturer: editManufacturer, description: editDescription };
      setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? updated : p)));
      setSelectedProduct(updated);
      setEditMode(false);
    }
    setSavingEdit(false);
  };

  const deleteProduct = async (product: Product) => {
    setDeletingId(product.id);
    setSaveError(null);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      setSaveError(`Delete failed: ${error.message}`);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setSelectedProduct(null);
      setConfirmDelete(false);
    }
    setDeletingId(null);
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas || !selectedProduct) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedProduct.name}-verify-qr.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
          Product Catalog
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage stock quantity — all products are visible in the mobile app
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or manufacturer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      {/* Save error banner */}
      {saveError && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/[0.06] text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] p-6 animate-pulse"
            >
              <div className="h-5 bg-gray-200 dark:bg-white/[0.08] rounded-lg mb-3 w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-white/[0.04] rounded mb-4 w-1/2" />
              <div className="h-6 bg-gray-200 dark:bg-white/[0.08] rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/[0.06] border border-gray-100 dark:border-white/10 flex items-center justify-center mb-5">
            <Boxes className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Products Yet
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-5 max-w-xs">
            No products registered under this account.
          </p>
          <Link
            href="/dashboard/register-product"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/25"
          >
            Register a Product
          </Link>
        </div>
      ) : filteredProducts.length === 0 && search ? (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] p-12 flex flex-col items-center text-center">
          <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No products match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        /* Product grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] p-6 shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-blue-600/5 dark:hover:bg-white/[0.06] hover:border-blue-100 dark:hover:border-blue-500/20 transition-all duration-200"
            >
              {/* Product image */}
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-36 object-cover rounded-xl mb-4 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                />
              )}

              {/* Top row */}
              <div className="flex justify-between items-start mb-1">
                <h2
                  onClick={() => setSelectedProduct(product)}
                  className="text-base font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                >
                  {product.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex-shrink-0 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  On-Chain
                </span>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                {product.manufacturer}
              </p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3">
                RM {product.price}
              </p>

              {/* Quantity control */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-14">
                  Qty:
                </span>
                <button
                  onClick={() => updateQuantity(product.id, -1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-gray-900 dark:text-white w-6 text-center">
                  {product.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(product.id, 1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                >
                  +
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => saveProduct(product)}
                  disabled={savingId === product.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                >
                  {savingId === product.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </button>
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
                >
                  QR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) { setSelectedProduct(null); setConfirmDelete(false); }
          }}
        >
          <div className="bg-white dark:bg-neutral-950 w-full max-w-lg rounded-2xl border border-gray-100 dark:border-white/[0.08] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedProduct.name}
                </h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  {selectedProduct.manufacturer}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Blockchain Verified
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => editMode ? setEditMode(false) : openEdit(selectedProduct)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
                >
                  {editMode ? "Cancel" : "Edit"}
                </button>
                <button
                  onClick={() => { setSelectedProduct(null); setConfirmDelete(false); setEditMode(false); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Edit form */}
              {editMode && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Product Name</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Manufacturer</label>
                    <input value={editManufacturer} onChange={(e) => setEditManufacturer(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Note: blockchain data (price, ID) cannot be changed.
                  </p>
                  <button onClick={saveEdit} disabled={savingEdit}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25">
                    {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              )}

              {!editMode && (<>
              {/* Product image */}
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}

              {/* Blockchain info */}
              <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/[0.06] px-4 py-3">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                  Blockchain Product ID
                </p>
                <p className="text-lg font-mono font-bold text-blue-700 dark:text-blue-300">
                  #{selectedProduct.blockchainProductId}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                  Immutably recorded on-chain — cannot be altered
                </p>
              </div>

              {/* Quantity in modal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Stock Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateQuantity(selectedProduct.id, -1)}
                    className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white w-8 text-center">
                    {selectedProduct.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(selectedProduct.id, 1)}
                    className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                  >
                    +
                  </button>
                  <button
                    onClick={() => saveProduct(selectedProduct)}
                    disabled={savingId === selectedProduct.id}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-blue-600/25"
                  >
                    {savingId === selectedProduct.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div ref={qrRef} className="flex flex-col items-center gap-3 pt-2">
                <div className="bg-white p-4 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm">
                  <QRCodeCanvas value={selectedProduct.blockchainProductId} size={160} />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs">
                  Scan to retrieve blockchain product ID #{selectedProduct.blockchainProductId} for on-chain verification
                </p>
                <button
                  onClick={downloadQR}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/25"
                >
                  <Download className="w-4 h-4" />
                  Download Verification QR
                </button>
              </div>

              {/* Delete */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete product
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                      Delete &ldquo;{selectedProduct.name}&rdquo;? This cannot be undone.
                    </p>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteProduct(selectedProduct)}
                      disabled={deletingId === selectedProduct.id}
                      className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {deletingId === selectedProduct.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                )}
              </div>
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
