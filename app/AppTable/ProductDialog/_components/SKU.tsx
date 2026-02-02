import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MdError } from "react-icons/md";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import { Product } from "@/app/types";

interface SKUProps {
  allProducts: Product[];
}

export default function SKU({ allProducts }: SKUProps) {
  const {
    register,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const [skuError, setSkuError] = useState<string | null>(null);

  const handleSkuChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sku = event.target.value.trim();

    // Check if the SKU already exists
    const isSkuTaken = allProducts.some(
      (product) => product.sku.toLowerCase() === sku.toLowerCase()
    );

    if (isSkuTaken) {
      setSkuError("La referencia ya está en uso. Intenta con una nueva.");
      setError("sku", { type: "manual", message: "La referencia ya está en uso." });
    } else {
      setSkuError(null);
      clearErrors("sku");
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-2">
      <Label htmlFor="sku" className="text-slate-600">
        Referencia
      </Label>
      <Input
        {...register("sku")}
        type="text"
        id="sku"
        className="h-11 shadow-none"
        onChange={handleSkuChange} // Validate SKU on change
      />
      {(skuError || errors.sku?.message) && (
        <div className="text-red-500 flex gap-1 items-center text-[13px]">
          <MdError />
          <p>{skuError || String(errors.sku?.message)}</p>
        </div>
      )}
    </div>
  );
}
