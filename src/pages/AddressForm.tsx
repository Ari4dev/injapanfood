import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addressService, CreateAddressData, UpdateAddressData } from '@/services/addressService';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, User, Phone, Building } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { prefectures } from '@/data/prefectures';
import { useLanguage } from '@/hooks/useLanguage';

const AddressForm = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<CreateAddressData>({
    name: '',
    phone: '',
    address: '',
    prefecture: '',
    city: '',
    postalCode: '',
    isDefault: false,
  });
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      addressService.getAddress(id)
        .then(address => {
          if (address) {
            setFormData({
              name: address.name,
              phone: address.phone,
              address: address.address,
              prefecture: address.prefecture,
              city: address.city,
              postalCode: address.postalCode,
              isDefault: address.isDefault,
            });
          }
        })
        .catch(console.error);
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrefectureChange = (value: string) => {
    setFormData({ ...formData, prefecture: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      try {
        if (isEdit) {
          await addressService.updateAddress({ id, ...formData } as UpdateAddressData);
          toast({
            title: t('common.success'),
            description: t('address.addressUpdated'),
          });
        } else {
          await addressService.addAddress(user.uid, formData);
          toast({
            title: t('common.success'),
            description: t('address.addressAdded'),
          });
        }
        navigate('/my-addresses');
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: t('common.error'),
          description: t('address.saveError'),
          variant: "destructive",
        });
      }
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
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/my-addresses')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('address.backToProfile')}
          </Button>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {isEdit ? t('address.editAddress') : t('address.addNewAddress')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('address.recipientName')} *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={t('address.recipientNamePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {t('address.phoneNumber')} *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder={t('address.phoneNumberPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {t('address.fullAddress')} *
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder={t('address.fullAddressPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('address.city')} *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder={t('address.cityPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prefecture">{t('address.prefecture')} *</Label>
                    <Select value={formData.prefecture} onValueChange={handlePrefectureChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('address.selectPrefecture')} />
                      </SelectTrigger>
                      <SelectContent>
                        {prefectures.map((prefecture) => (
                          <SelectItem key={prefecture.name_en} value={prefecture.name}>
                            {prefecture.name} ({prefecture.name_en})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t('address.postalCode')} *</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                    placeholder={t('address.postalCodePlaceholder')}
                    pattern="[0-9]{3}-[0-9]{4}"
                  />
                  <p className="text-sm text-gray-600">{t('address.postalCodeFormat')}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, isDefault: !!checked })
                    }
                  />
                  <Label htmlFor="isDefault" className="text-sm font-normal">
                    {t('address.setAsDefault')}
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/my-addresses')}
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {isEdit ? t('address.saveChanges') : t('address.addAddress')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AddressForm;

