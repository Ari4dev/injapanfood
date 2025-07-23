import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCODSettings, useUpdateCODSettings } from '@/hooks/useCODSettings';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Save, CreditCard, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const codSettingsSchema = z.object({
  surchargeAmount: z.string()
    .min(1, 'Biaya tambahan wajib diisi')
    .refine(val => !isNaN(Number(val)), {
      message: 'Biaya tambahan harus berupa angka',
    })
    .refine(val => Number(val) >= 0, {
      message: 'Biaya tambahan tidak boleh negatif',
    }),
  isEnabled: z.boolean(),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
});

type CODSettingsFormValues = z.infer<typeof codSettingsSchema>;

const CODSettings = () => {
  const { data: codSettings, isLoading } = useCODSettings();
  const updateCODSettings = useUpdateCODSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CODSettingsFormValues>({
    resolver: zodResolver(codSettingsSchema),
    defaultValues: {
      surchargeAmount: '250',
      isEnabled: true,
      description: 'Biaya tambahan untuk pembayaran COD (Cash on Delivery)',
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (codSettings) {
      form.reset({
        surchargeAmount: codSettings.surchargeAmount.toString(),
        isEnabled: codSettings.isEnabled,
        description: codSettings.description,
      });
    }
  }, [codSettings, form]);

  const onSubmit = async (data: CODSettingsFormValues) => {
    try {
      setIsSubmitting(true);
      
      await updateCODSettings.mutateAsync({
        surchargeAmount: Number(data.surchargeAmount),
        isEnabled: data.isEnabled,
        description: data.description,
      });
      
      toast({
        title: "Berhasil",
        description: "Pengaturan biaya tambahan COD berhasil diperbarui",
      });
    } catch (error) {
      console.error('Error updating COD settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui pengaturan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Biaya Tambahan COD</h1>
          <p className="text-gray-600">Kelola biaya tambahan untuk pembayaran Cash on Delivery (COD)</p>
        </div>

        <div className="max-w-2xl">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Biaya tambahan COD akan ditambahkan ke total pesanan ketika pelanggan memilih metode pembayaran COD. 
              Biaya ini akan ditambahkan di atas ongkos kirim yang sudah ada berdasarkan prefektur.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Pengaturan Biaya Tambahan COD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="isEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Aktifkan Biaya Tambahan COD
                          </FormLabel>
                          <FormDescription>
                            Jika diaktifkan, biaya tambahan akan dikenakan untuk pembayaran COD
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="surchargeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biaya Tambahan COD (¥)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="1"
                            placeholder="250"
                          />
                        </FormControl>
                        <FormDescription>
                          Biaya tambahan dalam Yen yang akan dikenakan untuk pembayaran COD
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Deskripsi biaya tambahan COD"
                          />
                        </FormControl>
                        <FormDescription>
                          Deskripsi yang akan ditampilkan kepada pelanggan
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview Section */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3">Preview Perhitungan</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal Produk:</span>
                        <span>¥2,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ongkos Kirim (Nagano):</span>
                        <span>¥500</span>
                      </div>
                      {form.watch('isEnabled') && (
                        <div className="flex justify-between text-orange-600">
                          <span>Biaya Tambahan COD:</span>
                          <span>¥{form.watch('surchargeAmount') || '0'}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>¥{2000 + 500 + (form.watch('isEnabled') ? Number(form.watch('surchargeAmount')) || 0 : 0)}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || updateCODSettings.isPending}
                  >
                    {isSubmitting || updateCODSettings.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Pengaturan
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <AlertCircle className="w-5 h-5 mr-2" />
                Informasi Penting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-blue-700">
              <p>
                • Biaya tambahan COD akan otomatis ditambahkan ke total pesanan ketika pelanggan memilih pembayaran COD
              </p>
              <p>
                • Biaya ini terpisah dari ongkos kirim berdasarkan prefektur dan akan ditampilkan secara transparan
              </p>
              <p>
                • Perubahan pengaturan akan langsung berlaku untuk pesanan baru
              </p>
              <p>
                • Pastikan untuk menginformasikan kepada pelanggan tentang adanya biaya tambahan ini
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CODSettings;