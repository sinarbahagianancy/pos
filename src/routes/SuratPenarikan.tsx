import React from "react";
import type { Product, SerialNumber, StoreConfig } from "../../app/types";

// Placeholder — full implementation lands in the next commit
const SuratPenarikanView: React.FC<{
  products: Product[];
  sns: SerialNumber[];
  storeConfig: StoreConfig;
  staffName: string;
}> = () => (
  <div className="max-w-[1600px] mx-auto pb-20">
    <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">
      Penarikan Barang
    </h1>
    <p className="text-sm text-slate-500 font-medium mt-1">Coming soon</p>
  </div>
);

export default SuratPenarikanView;
