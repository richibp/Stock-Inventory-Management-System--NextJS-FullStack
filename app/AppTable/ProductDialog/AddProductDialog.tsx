/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProductStore } from "@/app/useProductStore";
import { useToast } from "@/hooks/use-toast";
import ProductName from "./_components/ProductName";
import SKU from "./_components/SKU";
import Quantity from "./_components/Quantity";
import Price from "./_components/Price";
import PurchasePrice from "./_components/PurchasePrice";
import { Product } from "@/app/types";

const ProductSchema = z.object({
  productName: z
    .string()
    .min(1, "El nombre del producto es requerido")
    .max(100, "El nombre del producto debe tener 100 caracteres o menos"),
  sku: z
    .string()
    .min(1, "La referencia es requerida")
    .regex(/^[a-zA-Z0-9-_]+$/, "La referencia debe ser alfanumérica"),
  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .nonnegative("La cantidad no puede ser negativa"),
  price: z.number().nonnegative("El precio no puede ser negativo"),
  purchasePrice: z.number().nonnegative("El precio de compra no puede ser negativo"),
});

interface ProductFormData {
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  purchasePrice: number;
}

interface AddProductDialogProps {
  allProducts: Product[];
  userId: string;
}

export default function AddProductDialog({
  allProducts,
  userId,
}: AddProductDialogProps) {
  const methods = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      productName: "",
      sku: "",
      quantity: 0,
      price: 0.0,
      purchasePrice: 0.0,
    },
  });

  const { reset } = methods;

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Button loading state
  const dialogCloseRef = useRef<HTMLButtonElement | null>(null);

  const {
    isLoading,
    setOpenProductDialog,
    openProductDialog,
    setSelectedProduct,
    selectedProduct,
    addProduct,
    updateProduct,
    loadProducts,
    categories,
    suppliers,
  } = useProductStore();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedProduct) {
      reset({
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: selectedProduct.quantity,
        price: selectedProduct.price,
        purchasePrice: selectedProduct.purchasePrice,
      });
      setSelectedCategory(selectedProduct.categoryId || "");
      setSelectedSupplier(selectedProduct.supplierId || "");
    } else {
      // Reset form to default values for adding a new product
      reset({
        productName: "",
        sku: "",
        quantity: 0,
        price: 0.0,
        purchasePrice: 0.0,
      });
      setSelectedCategory("");
      setSelectedSupplier("");
    }
  }, [selectedProduct, openProductDialog, reset]);

  const calculateStatus = (quantity: number): string => {
    if (quantity > 20) return "Disponible";
    if (quantity > 0 && quantity <= 20) return "Stock Bajo";
    return "Sin Stock";
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true); // Start loading
    const status: Product["status"] = calculateStatus(data.quantity);

    try {
      if (!selectedProduct) {
        const newProduct: Product = {
          id: Date.now().toString(),
          supplierId: selectedSupplier,
          name: data.productName,
          price: data.price,
          purchasePrice: data.purchasePrice,
          quantity: data.quantity,
          sku: data.sku,
          status,
          categoryId: selectedCategory,
          createdAt: new Date(),
          userId: userId,
        };

        const result = await addProduct(newProduct);

        if (result.success) {
          toast({
            title: "¡Producto creado exitosamente!",
            description: `"${data.productName}" ha sido añadido a tu inventario.`,
          });
          dialogCloseRef.current?.click();
          loadProducts();
          setOpenProductDialog(false);
        } else {
          toast({
            title: "Error en la creación",
            description: "No se pudo añadir el producto. Por favor, inténtalo de nuevo.",
            variant: "destructive",
          });
        }
      } else {
        const productToUpdate: Product = {
          id: selectedProduct.id,
          createdAt: new Date(selectedProduct.createdAt), // Convert string to Date
          supplierId: selectedSupplier,
          name: data.productName,
          price: data.price,
          purchasePrice: data.purchasePrice,
          quantity: data.quantity,
          sku: data.sku,
          status,
          categoryId: selectedCategory,
          userId: selectedProduct.userId,
        };

        const result = await updateProduct(productToUpdate);
        if (result.success) {
          toast({
            title: "¡Producto actualizado exitosamente!",
            description: `"${data.productName}" ha sido actualizado en tu inventario.`,
          });
          loadProducts();
          setOpenProductDialog(false);
        } else {
          toast({
            title: "Error en la actualización",
            description: "No se pudo actualizar el producto. Por favor, inténtalo de nuevo.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Operación fallida",
        description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // When opening the dialog for adding a new product, clear any selected product
      setSelectedProduct(null);
    } else {
      // When closing the dialog, also clear the selected product to ensure clean state
      setSelectedProduct(null);
    }
    setOpenProductDialog(open);
  };

  return (
    <Dialog open={openProductDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 font-semibold">+Añadir Producto</Button>
      </DialogTrigger>
      <DialogContent
        className="p-4 sm:p-7 sm:px-8 poppins max-h-[90vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-[22px]">
            {selectedProduct ? "Actualizar Producto" : "Añadir Producto"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription id="dialog-description">
          Ingresa los detalles del producto a continuación.
        </DialogDescription>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProductName />
              <SKU allProducts={allProducts} />
              <Quantity />
              <PurchasePrice />
              <Price />
              <div>
                <label htmlFor="category" className="block text-sm font-medium">
                  Categoría
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Seleccionar Categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium">
                  Proveedor
                </label>
                <select
                  id="supplier"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Seleccionar Proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-4">
              <DialogClose asChild>
                <Button
                  ref={dialogCloseRef}
                  variant="secondary"
                  className="h-11 w-full sm:w-auto px-11"
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 w-full sm:w-auto px-11"
                isLoading={isSubmitting} // Button loading effect
              >
                {isSubmitting
                  ? "Cargando..."
                  : selectedProduct
                  ? "Actualizar Producto"
                  : "Añadir Producto"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
