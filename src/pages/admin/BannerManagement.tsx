import { useState } from 'react';
import { useBanners, useAddBanner, useUpdateBanner, useDeleteBanner, useUploadBannerImage, useActiveBannersCount } from '@/hooks/useBanners';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Edit, Trash2, Image, ExternalLink, AlertTriangle, Upload, X } from 'lucide-react';
import { Banner } from '@/types';
import { auth } from '@/config/firebase';

const BannerManagement = () => {
  const { data: banners = [], isLoading, refetch } = useBanners();
  const { data: activeBannersCount = 0 } = useActiveBannersCount();
  const addBanner = useAddBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const uploadImage = useUploadBannerImage();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    link_url: '',
    order: 1,
    is_active: true
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format file tidak valid",
        description: "Harap unggah file gambar (JPG, PNG, WEBP, GIF)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ukuran file terlalu besar",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      link_url: '',
      order: 1,
      is_active: true
    });
    setImageFile(null);
    setImagePreview(null);
    setSelectedBanner(null);
  };

  const handleAddBanner = async () => {
    if (!imageFile) {
      toast({
        title: "Error",
        description: "Gambar banner wajib diunggah",
        variant: "destructive"
      });
      return;
    }

    // Check active banner limit
    if (formData.is_active && activeBannersCount >= 5) {
      toast({
        title: "Error",
        description: "Maksimal 5 banner aktif diperbolehkan",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "Anda harus login sebagai admin untuk mengunggah banner",
          variant: "destructive"
        });
        return;
      }

      // Debug: Log current user email
      console.log('Current user email:', user.email);
      console.log('User auth token claims:', await user.getIdTokenResult());
      
      // Check if user email is in admin list
      const adminEmails = ['admin@gmail.com', 'ari4rich@gmail.com', 'newadmin@gmail.com', 'injpn@food.com', 'admin2@gmail.com'];
      if (!user.email || !adminEmails.includes(user.email)) {
        toast({
          title: "Error Akses Admin",
          description: `Email Anda (${user.email}) tidak terdaftar sebagai admin. Hubungi administrator untuk mendapatkan akses.`,
          variant: "destructive"
        });
        return;
      }
      // Upload image first
      const imageUrl = await uploadImage.mutateAsync(imageFile);
      
      // Add banner
      await addBanner.mutateAsync({
        image_url: imageUrl,
        link_url: formData.link_url || undefined,
        order: formData.order,
        is_active: formData.is_active
      });

      toast({
        title: "Berhasil",
        description: "Banner berhasil ditambahkan",
      });

      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error adding banner:', error);
      
      // Handle specific storage permission error
      if (error instanceof Error && error.message.includes('storage/unauthorized')) {
        toast({
          title: "Error Akses",
          description: `Akses ditolak. Email Anda (${auth.currentUser?.email}) tidak memiliki izin admin untuk mengunggah gambar. Pastikan Anda login dengan email admin yang terdaftar.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Gagal menambahkan banner",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditBanner = async () => {
    if (!selectedBanner) return;

    // Check active banner limit when activating
    if (formData.is_active && !selectedBanner.is_active && activeBannersCount >= 5) {
      toast({
        title: "Error",
        description: "Maksimal 5 banner aktif diperbolehkan",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "Anda harus login sebagai admin untuk memperbarui banner",
          variant: "destructive"
        });
        return;
      }

      // Check if user email is in admin list
      const adminEmails = ['admin@gmail.com', 'ari4rich@gmail.com', 'newadmin@gmail.com', 'injpn@food.com', 'admin2@gmail.com'];
      if (!user.email || !adminEmails.includes(user.email)) {
        toast({
          title: "Error Akses Admin",
          description: `Email Anda (${user.email}) tidak terdaftar sebagai admin. Hubungi administrator untuk mendapatkan akses.`,
          variant: "destructive"
        });
        return;
      }
      let imageUrl = selectedBanner.image_url;
      
      // Upload new image if provided
      if (imageFile) {
        imageUrl = await uploadImage.mutateAsync(imageFile);
      }

      // Update banner
      await updateBanner.mutateAsync({
        id: selectedBanner.id,
        updates: {
          image_url: imageUrl,
          link_url: formData.link_url || undefined,
          order: formData.order,
          is_active: formData.is_active
        }
      });

      toast({
        title: "Berhasil",
        description: "Banner berhasil diperbarui",
      });

      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error updating banner:', error);
      
      // Handle specific storage permission error
      if (error instanceof Error && error.message.includes('storage/unauthorized')) {
        toast({
          title: "Error Akses",
          description: `Akses ditolak. Email Anda (${auth.currentUser?.email}) tidak memiliki izin admin untuk mengunggah gambar. Pastikan Anda login dengan email admin yang terdaftar.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Gagal memperbarui banner",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await deleteBanner.mutateAsync(id);
      toast({
        title: "Berhasil",
        description: "Banner berhasil dihapus",
      });
      refetch();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus banner",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData({
      link_url: banner.link_url || '',
      order: banner.order,
      is_active: banner.is_active
    });
    setImagePreview(banner.image_url);
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Banner</h1>
            <p className="text-gray-600">Kelola banner yang ditampilkan di halaman beranda (maksimal 5 banner aktif)</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {activeBannersCount}/5 Banner Aktif
            </Badge>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={activeBannersCount >= 5}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Banner Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan banner baru untuk ditampilkan di halaman beranda
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="banner-image">Gambar Banner *</Label>
                    <Input
                      id="banner-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: JPG, PNG, WEBP, GIF. Maksimal 5MB
                    </p>
                    
                    {imagePreview && (
                      <div className="mt-3 relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 bg-red-500 text-white hover:bg-red-600"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="link-url">URL Link (Opsional)</Label>
                    <Input
                      id="link-url"
                      value={formData.link_url}
                      onChange={(e) => handleInputChange('link_url', e.target.value)}
                      placeholder="https://example.com atau /products"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL tujuan saat banner diklik (kosongkan jika tidak perlu)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="order">Urutan Tampilan</Label>
                    <Input
                      id="order"
                      type="number"
                      min="1"
                      value={formData.order}
                      onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                      disabled={activeBannersCount >= 5 && formData.is_active}
                    />
                    <Label htmlFor="is-active">Banner Aktif</Label>
                    {activeBannersCount >= 5 && (
                      <span className="text-xs text-red-500">
                        (Maksimal 5 banner aktif)
                      </span>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}>
                    Batal
                  </Button>
                  <Button 
                    onClick={handleAddBanner}
                    disabled={addBanner.isPending || uploadImage.isPending}
                  >
                    {addBanner.isPending || uploadImage.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {activeBannersCount >= 5 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Batas Banner Aktif Tercapai</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Anda telah mencapai batas maksimal 5 banner aktif. Nonaktifkan banner lain untuk menambah banner baru.
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Daftar Banner ({banners.length})
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {banners.length === 0 ? (
              <div className="text-center py-8">
                <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada banner</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Tambahkan banner pertama untuk ditampilkan di halaman beranda
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead>Urutan</TableHead>
                      <TableHead>Link URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell>
                          <img 
                            src={banner.image_url} 
                            alt="Banner preview"
                            className="w-20 h-12 object-cover rounded border"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {banner.order}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {banner.link_url ? (
                            <div className="flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="text-sm text-blue-600 truncate max-w-[200px]">
                                {banner.link_url}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Tidak ada link</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={banner.is_active ? "default" : "secondary"}>
                            {banner.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(banner.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(banner)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Banner</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus banner ini? Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBanner(banner.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Hapus Banner
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Banner</DialogTitle>
              <DialogDescription>
                Perbarui informasi banner
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-banner-image">Gambar Banner</Label>
                <Input
                  id="edit-banner-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kosongkan jika tidak ingin mengubah gambar
                </p>
                
                {imagePreview && (
                  <div className="mt-3 relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    {imageFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(selectedBanner?.image_url || null);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="edit-link-url">URL Link (Opsional)</Label>
                <Input
                  id="edit-link-url"
                  value={formData.link_url}
                  onChange={(e) => handleInputChange('link_url', e.target.value)}
                  placeholder="https://example.com atau /products"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="edit-order">Urutan Tampilan</Label>
                <Input
                  id="edit-order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  disabled={!selectedBanner?.is_active && activeBannersCount >= 5 && formData.is_active}
                />
                <Label htmlFor="edit-is-active">Banner Aktif</Label>
                {!selectedBanner?.is_active && activeBannersCount >= 5 && formData.is_active && (
                  <span className="text-xs text-red-500">
                    (Maksimal 5 banner aktif)
                  </span>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}>
                Batal
              </Button>
              <Button 
                onClick={handleEditBanner}
                disabled={updateBanner.isPending || uploadImage.isPending}
              >
                {updateBanner.isPending || uploadImage.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default BannerManagement;