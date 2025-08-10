import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const AffiliateManagement = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Auto redirect to new affiliate management after 3 seconds
    const timer = setTimeout(() => {
      navigate('/admin/shopee-affiliate-management');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">System Update</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              The affiliate system has been upgraded to a new version.
            </p>
            <p className="text-sm text-gray-500">
              You will be redirected to the new management panel in a few seconds...
            </p>
            <Button 
              onClick={() => navigate('/admin/shopee-affiliate-management')}
              className="w-full"
            >
              Go to New Affiliate Management
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AffiliateManagement;
