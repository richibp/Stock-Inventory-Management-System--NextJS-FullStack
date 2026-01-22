"use client";

import { Product } from "@/app/types";
import { Column, ColumnDef } from "@tanstack/react-table";
//import { ReactNode } from "react";

import ProductDropDown from "./ProductsDropDown";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { QRCodeHover } from "@/components/ui/qr-code-hover";
import { AlertTriangle, ArrowUpDown, Minus, Plus } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { useProductStore } from "../useProductStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type SortableHeaderProps = {
  column: Column<Product, unknown>;
  label: string;
};

const SortableHeader: React.FC<SortableHeaderProps> = ({ column, label }) => {
  const isSorted = column.getIsSorted();
  const SortingIcon =
    isSorted === "asc"
      ? IoMdArrowUp
      : isSorted === "desc"
        ? IoMdArrowDown
        : ArrowUpDown;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="" asChild>
        <div
          className={`flex items-start py-[14px] select-none cursor-pointer p-2 gap-1 ${isSorted && "text-primary"
            }`}
          aria-label={`Sort by ${label}`}
        >
          {label}
          <SortingIcon className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom">
        {/* Ascending Sorting */}
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <IoMdArrowUp className="mr-2 h-4 w-4" />
          Ascendente
        </DropdownMenuItem>
        {/* Descending Sorting */}
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <IoMdArrowDown className="mr-2 h-4 w-4" />
          Descendente
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Fecha de Creación" />
    ),
    cell: ({ getValue }) => {
      const dateValue = getValue<string | Date>();
      const date =
        typeof dateValue === "string" ? new Date(dateValue) : dateValue;

      if (!date || isNaN(date.getTime())) {
        return <span>Fecha Desconocida</span>;
      }

      return (
        <span>
          {date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "name",
    cell: ({ row }) => {
      const name = row.original.name;
      return <span>{name}</span>;
    },
    header: ({ column }) => <SortableHeader column={column} label="Nombre" />,
  },
  {
    accessorKey: "sku",
    header: ({ column }) => <SortableHeader column={column} label="SKU" />,
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => <SortableHeader column={column} label="Cantidad" />,
    cell: ({ row }) => {
      const quantity = row.original.quantity;
      const productId = row.original.id;
      const isLowStock = quantity > 0 && quantity < 10;
      const isOutOfStock = quantity === 0;
      const updateProductQuantity = useProductStore((state) => state.updateProductQuantity);
      const { toast } = useToast();

      const handleIncrement = async () => {
        const result = await updateProductQuantity(productId, quantity + 1);
        if (result.success) {
          toast({
            title: "Cantidad actualizada",
            description: `La cantidad se incrementó a ${quantity + 1}`,
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo actualizar la cantidad",
            variant: "destructive",
          });
        }
      };

      const handleDecrement = async () => {
        if (quantity > 0) {
          const result = await updateProductQuantity(productId, quantity - 1);
          if (result.success) {
            toast({
              title: "Cantidad actualizada",
              description: `La cantidad se decrementó a ${quantity - 1}`,
            });
          } else {
            toast({
              title: "Error",
              description: "No se pudo actualizar la cantidad",
              variant: "destructive",
            });
          }
        }
      };

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleDecrement}
            disabled={quantity === 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className={`min-w-[2rem] text-center ${isLowStock || isOutOfStock ? "font-semibold" : ""}`}>
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleIncrement}
          >
            <Plus className="h-3 w-3" />
          </Button>
          {isLowStock && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
          {isOutOfStock && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => <SortableHeader column={column} label="Precio" />,
    cell: ({ getValue }) => `€${getValue<number>().toFixed(2)}`,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Estado" />,
    cell: ({ row }) => {
      const quantity = row.original.quantity;
      let status = "";
      let colorClass = "";

      if (quantity > 20) {
        status = "Disponible";
        colorClass = "bg-green-100 text-green-600";
      } else if (quantity > 0 && quantity <= 20) {
        status = "Stock Bajo";
        colorClass = "bg-orange-100 text-orange-600";
      } else {
        status = "Sin Stock";
        colorClass = "bg-red-100 text-red-600";
      }

      return (
        <span
          className={`px-3 py-[2px] rounded-full font-medium ${colorClass} flex gap-1 items-center w-fit`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Categoría",
    cell: ({ row }) => {
      const categoryName = row.original.category;
      return <span>{categoryName || "Desconocido"}</span>;
    },
  },
  {
    accessorKey: "supplier",
    header: "Proveedor",
    cell: ({ row }) => {
      const supplierName = row.original.supplier; // Display supplier name
      return <span>{supplierName || "Desconocido"}</span>;
    },
  },
  // {
  //   id: "qrCode",
  //   header: "Código QR",
  //   cell: ({ row }) => {
  //     const product = row.original;
  //     const qrData = JSON.stringify({
  //       id: product.id,
  //       name: product.name,
  //       sku: product.sku,
  //       price: product.price,
  //       quantity: product.quantity,
  //       status: product.status,
  //       category: product.category,
  //       supplier: product.supplier,
  //     });

  //     return (
  //       <QRCodeHover
  //         data={qrData}
  //         title={`${product.name} QR`}
  //         size={200}
  //       />
  //     );
  //   },
  // },
  {
    id: "actions",
    cell: ({ row }) => {
      return <ProductDropDown row={row} />;
    },
  },
];

// Debug log for columns - only log in development
if (process.env.NODE_ENV === 'development') {
  console.log("Columns passed to useReactTable:", columns);
}
