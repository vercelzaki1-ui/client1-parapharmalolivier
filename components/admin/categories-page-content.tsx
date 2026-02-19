"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderTree, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Category } from "@/lib/types"

export function CategoriesPageContent() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formParentId, setFormParentId] = useState<string>("none")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data)
      // Expand all by default
      setExpandedCategories(new Set(data.map((c: Category) => c.id)))
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const resetForm = () => {
    setFormName("")
    setFormSlug("")
    setFormDescription("")
    setFormParentId("none")
    setEditingCategory(null)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormName(category.name)
    setFormSlug(category.slug)
    setFormDescription(category.description)
    setFormParentId(category.parentId || "none")
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async () => {
    const payload = {
      name: formName,
      slug: formSlug || generateSlug(formName),
      description: formDescription,
      parentId: formParentId === "none" ? null : formParentId,
    }

    try {
      let response: Response

      if (editingCategory) {
        response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Échec de l'enregistrement")
      }

      await fetchCategories()
      setIsAddDialogOpen(false)
      resetForm()
      toast({
        title: "Succès",
        description: editingCategory ? "Catégorie mise à jour" : "Catégorie créée",
      })
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer la catégorie",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Échec de la suppression")
      }

      await fetchCategories()
      toast({ title: "Succès", description: "Catégorie supprimée" })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer la catégorie",
        variant: "destructive",
      })
    }
  }

  // Get main categories (no parent) for the parent selector
  const mainCategories = categories.filter((c) => !c.parentId)

  // Count total subcategories
  const totalSubcategories = categories.reduce((acc, cat) => acc + (cat.children?.length || 0), 0)

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Catégories</h1>
          <p className="text-muted-foreground">
            {mainCategories.length} catégories principales, {totalSubcategories} sous-catégories
          </p>
        </div>

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une catégorie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Modifiez les informations de la catégorie"
                  : "Créez une nouvelle catégorie ou sous-catégorie"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    if (!editingCategory) {
                      setFormSlug(generateSlug(e.target.value))
                    }
                  }}
                  placeholder="ex: Nettoyants"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="ex: nettoyants"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent">Catégorie parente</Label>
                <Select value={formParentId} onValueChange={setFormParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune (catégorie principale)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune (catégorie principale)</SelectItem>
                    {mainCategories
                      .filter((c) => c.id !== editingCategory?.id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Description de la catégorie..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!formName}>
                {editingCategory ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Tree */}
      <div className="border rounded-lg divide-y">
        {categories.map((category) => (
          <div key={category.id}>
            {/* Main Category Row */}
            <div className="flex items-center gap-4 p-4 hover:bg-muted/50">
              <button onClick={() => toggleExpand(category.id)} className="p-1 hover:bg-muted rounded">
                {category.children && category.children.length > 0 ? (
                  expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )
                ) : (
                  <div className="w-4" />
                )}
              </button>

              <FolderTree className="h-5 w-5 text-primary" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.children?.length || 0} sous-cat.
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">/{category.slug}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer la catégorie ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action supprimera définitivement la catégorie "{category.name}"
                        {category.children && category.children.length > 0 && (
                          <> et ses {category.children.length} sous-catégories</>
                        )}
                        . Les produits associés ne seront plus catégorisés.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(category.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Subcategories */}
            {expandedCategories.has(category.id) && category.children && category.children.length > 0 && (
              <div className="bg-muted/30">
                {category.children.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-4 p-4 pl-14 border-t border-border/50 hover:bg-muted/50"
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />

                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{sub.name}</span>
                      <p className="text-xs text-muted-foreground">
                        /{sub.slug} • {sub.productCount} produits
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(sub)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la sous-catégorie ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera définitivement "{sub.name}". Les produits associés ne seront plus
                              catégorisés.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(sub.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
