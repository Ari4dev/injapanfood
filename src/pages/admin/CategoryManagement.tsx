import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Plus, Tag, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { 
  getAllCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory,
  getCategoryProductCount,
  initializeDefaultCategories
} from '@/services/categoryService';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productCount?: number;
  created_at?: string;
  updated_at?: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const categoriesData = await getAllCategories();
      
      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        categoriesData.map(async (category) => {
          const count = await getCategoryProductCount(category.id);
          return { ...category, productCount: count };
        })
      );
      
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Remove consecutive hyphens
      
      await addCategory({
        name: formData.name,
        slug,
        description: formData.description,
        icon: formData.icon || '📦' // Default icon if none provided
      });
      
      toast({
        title: "Success",
        description: "Category added successfully",
      });
      
      // Reset form and close dialog
      setFormData({ name: '', description: '', icon: '' });
      setIsAddDialogOpen(false);
      
      // Refresh categories
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate slug from name if name changed
      let slug = selectedCategory.slug;
      if (formData.name !== selectedCategory.name) {
        slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      
      await updateCategory(selectedCategory.id, {
        name: formData.name,
        slug,
        description: formData.description,
        icon: formData.icon
      });
      
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      
      // Reset form and close dialog
      setFormData({ name: '', description: '', icon: '' });
      setSelectedCategory(null);
      setIsEditDialogOpen(false);
      
      // Refresh categories
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setIsDeleting(true);
    try {
      await deleteCategory(categoryId);
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      
      // Refresh categories
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInitializeCategories = async () => {
    setIsInitializing(true);
    try {
      await initializeDefaultCategories();
      toast({
        title: "Success",
        description: "Default categories initialized successfully",
      });
      fetchCategories();
    } catch (error) {
      console.error('Error initializing categories:', error);
      toast({
        title: "Error",
        description: "Failed to initialize default categories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || ''
    });
    setIsEditDialogOpen(true);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Common icon options
  const commonIcons = ['🍿', '🌶️', '🍜', '🧊', '🥬', '🍃', '🍹', '💊', '🔌', '🍫', '🍬', '🍭', '🍪', '🍩', '🍰', '🍦'];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Kategori</h1>
            <p className="text-gray-600">Kelola kategori produk untuk memudahkan navigasi dan pencarian</p>
          </div>
          
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kategori Baru
          </Button>
          
          <Button 
            onClick={handleInitializeCategories} 
            variant="outline"
            disabled={isInitializing}
            className="ml-2"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isInitializing ? 'animate-spin' : ''}`} />
            {isInitializing ? 'Initializing...' : 'Initialize Default Categories'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                <span>Daftar Kategori ({filteredCategories.length})</span>
              </CardTitle>
              
              <div className="flex space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari kategori..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button variant="outline" onClick={fetchCategories} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Memuat kategori...</span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchTerm ? 'Tidak ada kategori yang cocok' : 'Belum ada kategori'}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {searchTerm ? 'Coba gunakan kata kunci lain' : 'Tambahkan kategori pertama Anda untuk mulai mengorganisir produk'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon</TableHead>
                      <TableHead>Nama Kategori</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Jumlah Produk</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <span className="text-2xl">{category.icon || '📦'}</span>
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-sm text-gray-500">{category.slug}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {category.productCount || 0} produk
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  disabled={isDeleting || (category.productCount && category.productCount > 0)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus kategori "{category.name}"?
                                    {category.productCount && category.productCount > 0 && (
                                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
                                        <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                                        <span className="text-yellow-700">
                                          Kategori ini memiliki {category.productCount} produk terkait. 
                                          Pindahkan produk ke kategori lain sebelum menghapus.
                                        </span>
                                      </div>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={category.productCount && category.productCount > 0}
                                  >
                                    {isDeleting ? 'Menghapus...' : 'Hapus Kategori'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
            <DialogDescription>
              Tambahkan kategori baru untuk mengorganisir produk Anda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nama Kategori *</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Contoh: Minuman, Rempah Instan, dll."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category-description">Deskripsi (Opsional)</Label>
              <Textarea
                id="category-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Deskripsi singkat tentang kategori ini"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category-icon">Icon (Emoji) *</Label>
              <Input
                id="category-icon"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                placeholder="Contoh: 🍹, 🌶️, 📱"
                maxLength={2}
              />
              <div className="mt-2">
                <Label className="text-xs text-gray-500 mb-1 block">Pilih icon:</Label>
                <div className="flex flex-wrap gap-2">
                  {commonIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleInputChange('icon', icon)}
                      className={`w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-gray-100 ${
                        formData.icon === icon ? 'bg-primary/10 border border-primary/30' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddCategory}>
              Tambah Kategori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>
              Ubah informasi kategori
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Nama Kategori *</Label>
              <Input
                id="edit-category-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Contoh: Minuman, Rempah Instan, dll."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Deskripsi (Opsional)</Label>
              <Textarea
                id="edit-category-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Deskripsi singkat tentang kategori ini"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category-icon">Icon (Emoji) *</Label>
              <Input
                id="edit-category-icon"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                placeholder="Contoh: 🍹, 🌶️, 📱"
                maxLength={2}
              />
              <div className="mt-2">
                <Label className="text-xs text-gray-500 mb-1 block">Pilih icon:</Label>
                <div className="flex flex-wrap gap-2">
                  {commonIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleInputChange('icon', icon)}
                      className={`w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-gray-100 ${
                        formData.icon === icon ? 'bg-primary/10 border border-primary/30' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {selectedCategory && selectedCategory.productCount && selectedCategory.productCount > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                <div className="text-blue-500 mr-2 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-blue-700">
                  Kategori ini memiliki {selectedCategory.productCount} produk terkait. 
                  Perubahan nama kategori akan mempengaruhi semua produk tersebut.
                </span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedCategory(null);
              setFormData({ name: '', description: '', icon: '' });
            }}>
              Batal
            </Button>
            <Button onClick={handleEditCategory}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CategoryManagement;