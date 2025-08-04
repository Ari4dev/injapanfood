import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { addressService, Address } from '@/services/addressService';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Edit3, Trash2, Star, ArrowLeft, Phone, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MyAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      addressService.getUserAddresses(user.uid)
        .then(setAddresses)
        .catch(console.error);
    }
  }, [user]);

  const handleAddNew = () => {
    navigate('/add-address');
  };

  const handleEdit = (id: string) => {
    navigate(`/edit-address/${id}`);
  };

  const handleDelete = (id: string) => {
    addressService.deleteAddress(id)
      .then(() => setAddresses(prev => prev.filter(address => address.id !== id)))
      .catch(console.error);
  };

  const { toast } = useToast();

  const handleSetDefault = (id: string) => {
    if (user) {
      addressService.setDefaultAddress(user.uid, id)
        .then(() => {
          addressService.getUserAddresses(user.uid)
            .then(setAddresses)
            .catch(console.error);
          toast({
            title: "Berhasil",
            description: "Alamat default berhasil diubah",
          });
        })
        .catch(console.error);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus alamat ${name}?`)) {
      addressService.deleteAddress(id)
        .then(() => {
          setAddresses(prev => prev.filter(address => address.id !== id));
          toast({
            title: "Berhasil",
            description: "Alamat berhasil dihapus",
          });
        })
        .catch(console.error);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profile')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Profil
          </Button>

          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                Alamat Saya
              </h1>
              <p className="text-gray-600 mt-1">Kelola alamat pengiriman Anda</p>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Alamat
            </Button>
          </div>

          {/* Addresses List */}
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada alamat</h3>
                  <p className="text-gray-600 mb-4">Tambahkan alamat pengiriman pertama Anda</p>
                  <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Alamat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              addresses.map(address => (
                <Card key={address.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-lg">{address.name}</h3>
                          {address.isDefault && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-gray-600">
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {address.phone}
                          </p>
                          <p className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5" />
                            {address.address}, {address.city}, {address.prefecture} {address.postalCode}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(address.id)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(address.id, address.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {!address.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(address.id)}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyAddresses;

