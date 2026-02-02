"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { useProductStore } from "@/app/useProductStore";
import { useToast } from "@/hooks/use-toast";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "@/app/authContext";
import axiosInstance from "@/utils/axiosInstance";

export default function AddSupplierDialog() {
  const [supplierName, setSupplierName] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Button loading state
  const [isEditing, setIsEditing] = useState(false); // Loading state for edit
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete
  const {
    suppliers,
    addSupplier,
    editSupplier,
    deleteSupplier,
    loadSuppliers,
  } = useProductStore();
  const { toast } = useToast();
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      loadSuppliers();
    }
  }, [isLoggedIn, loadSuppliers]);

  const handleAddSupplier = async () => {
    if (supplierName.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre del proveedor no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true); // Start loading
    try {
      const response = await axiosInstance.post("/suppliers", {
        name: supplierName,
        userId: user?.id,
      });

      if (response.status !== 201) {
        throw new Error("No se pudo añadir el proveedor");
      }

      const newSupplier = response.data;
      addSupplier(newSupplier);
      setSupplierName("");
      toast({
        title: "¡Proveedor creado exitosamente!",
        description: `"${supplierName}" ha sido añadido a tus proveedores.`,
      });
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast({
        title: "Error en la creación",
        description: "No se pudo añadir el proveedor. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  const handleEditSupplier = async (supplierId: string) => {
    if (newSupplierName.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre del proveedor no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true); // Start loading
    try {
      const response = await axiosInstance.put("/suppliers", {
        id: supplierId,
        name: newSupplierName,
      });

      if (response.status !== 200) {
        throw new Error("No se pudo actualizar el proveedor");
      }

      const updatedSupplier = response.data;
      editSupplier(supplierId, updatedSupplier.name);
      setEditingSupplier(null);
      setNewSupplierName("");
      toast({
        title: "¡Proveedor actualizado exitosamente!",
        description: `"${newSupplierName}" ha sido actualizado en tus proveedores.`,
      });
    } catch (error) {
      console.error("Error editing supplier:", error);
      toast({
        title: "Error en la actualización",
        description: "No se pudo actualizar el proveedor. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false); // Stop loading
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    setIsDeleting(true); // Start loading

    // Find the supplier name before deleting for the toast message
    const supplierToDelete = suppliers.find(sup => sup.id === supplierId);
    const supplierName = supplierToDelete?.name || "Proveedor Desconocido";

    try {
      const response = await axiosInstance.delete("/suppliers", {
        data: { id: supplierId },
      });

      if (response.status !== 204) {
        throw new Error("No se pudo eliminar el proveedor");
      }

      deleteSupplier(supplierId);
      toast({
        title: "¡Proveedor eliminado exitosamente!",
        description: `"${supplierName}" ha sido eliminado permanentemente.`,
      });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el proveedor. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false); // Stop loading
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-10 font-semibold">+Añadir Proveedor</Button>
      </DialogTrigger>
      <DialogContent
        className="p-4 sm:p-7 sm:px-8 poppins max-h-[90vh] overflow-y-auto"
        aria-describedby="supplier-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-[22px]">Añadir Proveedor</DialogTitle>
        </DialogHeader>
        <DialogDescription id="supplier-dialog-description">
          Ingresa el nombre del nuevo proveedor
        </DialogDescription>
        <Input
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          className="mt-4"
        />
        <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-4">
          <DialogClose asChild>
            <Button
              variant={"secondary"}
              className="h-11 w-full sm:w-auto px-11"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleAddSupplier}
            className="h-11 w-full sm:w-auto px-11"
            disabled={isSubmitting} // Button loading effect
          >
            {isSubmitting ? "Creando..." : "Añadir Proveedor"}
          </Button>
        </DialogFooter>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Proveedores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="p-4 border rounded-lg shadow-sm flex flex-col justify-between"
              >
                {editingSupplier === supplier.id ? (
                  <div className="flex flex-col space-y-2">
                    <Input
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      placeholder="Editar Proveedor"
                      className="h-8"
                    />
                    <div className="flex justify-between gap-2">
                      <Button
                        onClick={() => handleEditSupplier(supplier.id)}
                        className="h-8 w-full"
                        disabled={isEditing}
                      >
                        {isEditing ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        onClick={() => setEditingSupplier(null)}
                        className="h-8 w-full"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <span className="font-medium">{supplier.name}</span>
                    <div className="flex justify-between gap-2">
                      <Button
                        onClick={() => {
                          setEditingSupplier(supplier.id);
                          setNewSupplierName(supplier.name);
                        }}
                        className="h-8 w-full"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="h-8 w-full"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Eliminando..." : <FaTrash />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
