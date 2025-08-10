import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import QRCode from 'qrcode.react';
import {
  Link, QrCode, Copy, Download, Share2, ExternalLink, 
  Settings, Plus, Trash2, Edit, CheckCircle, AlertCircle,
  TrendingUp, MousePointer, ShoppingCart, Calendar,
  Facebook, Twitter, Instagram, Globe, Mail, MessageCircle,
  Smartphone, Monitor, ChevronRight, Info, Zap
} from 'lucide-react';

interface GeneratedLink {
  id: string;
  name: string;
  url: string;
  shortUrl: string;
  campaign: string;
  source: string;
  medium: string;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: Date;
  qrCode?: string;
  customParameters?: Record<string, string>;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'ended';
}

const LinkGenerator = ({ affiliateId = 'AFF123456' }: { affiliateId?: string }) => {
  const [baseUrl, setBaseUrl] = useState('https://injapanfood.com');
  const [productUrl, setProductUrl] = useState('');
  const [campaign, setCampaign] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [customName, setCustomName] = useState('');
  const [useShortUrl, setUseShortUrl] = useState(true);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([
    {
      id: '1',
      name: 'Summer Sale Instagram',
      url: 'https://injapanfood.com/products/ramen-set?ref=AFF123456&utm_source=instagram&utm_medium=story&utm_campaign=summer_sale',
      shortUrl: 'https://bjf.link/summer-ig',
      campaign: 'summer_sale',
      source: 'instagram',
      medium: 'story',
      clicks: 1543,
      conversions: 87,
      revenue: 304500,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Blog Post - Matcha Guide',
      url: 'https://injapanfood.com/products/matcha-kit?ref=AFF123456&utm_source=blog&utm_medium=article&utm_campaign=matcha_guide',
      shortUrl: 'https://bjf.link/matcha-blog',
      campaign: 'matcha_guide',
      source: 'blog',
      medium: 'article',
      clicks: 892,
      conversions: 45,
      revenue: 157500,
      createdAt: new Date('2024-01-20')
    }
  ]);

  const [campaigns] = useState<Campaign[]>([
    { id: '1', name: 'Summer Sale 2024', description: 'Summer promotion campaign', status: 'active' },
    { id: '2', name: 'New Year Special', description: 'New Year discount campaign', status: 'active' },
    { id: '3', name: 'Black Friday', description: 'Black Friday deals', status: 'paused' }
  ]);

  const qrCodeRef = useRef<HTMLDivElement>(null);

  const generateLink = () => {
    const params = new URLSearchParams({
      ref: affiliateId,
      ...(campaign && { utm_campaign: campaign }),
      ...(source && { utm_source: source }),
      ...(medium && { utm_medium: medium })
    });

    const fullUrl = productUrl 
      ? `${productUrl}?${params.toString()}`
      : `${baseUrl}?${params.toString()}`;

    const shortUrl = useShortUrl 
      ? `https://bjf.link/${Math.random().toString(36).substring(7)}`
      : fullUrl;

    const newLink: GeneratedLink = {
      id: Date.now().toString(),
      name: customName || `${source || 'direct'} - ${campaign || 'general'}`,
      url: fullUrl,
      shortUrl,
      campaign: campaign || 'general',
      source: source || 'direct',
      medium: medium || 'none',
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date()
    };

    setGeneratedLinks([newLink, ...generatedLinks]);
    toast({
      title: "Link Generated Successfully!",
      description: "Your affiliate link is ready to use.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };

  const downloadQRCode = (linkId: string) => {
    const canvas = document.querySelector(`#qr-${linkId} canvas`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${linkId}.png`;
      a.click();
    }
  };

  const SocialShareButtons = ({ url }: { url: string }) => (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="p-2">
        <Facebook className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="outline" className="p-2">
        <Twitter className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="outline" className="p-2">
        <Instagram className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="outline" className="p-2">
        <MessageCircle className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="outline" className="p-2">
        <Mail className="w-4 h-4" />
      </Button>
    </div>
  );

  const QuickTemplates = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="cursor-pointer hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Instagram className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Instagram Story</h4>
              <p className="text-sm text-gray-600">Perfect for IG stories and posts</p>
              <Button 
                size="sm" 
                variant="link" 
                className="p-0 mt-2"
                onClick={() => {
                  setSource('instagram');
                  setMedium('story');
                }}
              >
                Use Template <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Blog Article</h4>
              <p className="text-sm text-gray-600">For blog posts and articles</p>
              <Button 
                size="sm" 
                variant="link" 
                className="p-0 mt-2"
                onClick={() => {
                  setSource('blog');
                  setMedium('article');
                }}
              >
                Use Template <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Email Newsletter</h4>
              <p className="text-sm text-gray-600">For email campaigns</p>
              <Button 
                size="sm" 
                variant="link" 
                className="p-0 mt-2"
                onClick={() => {
                  setSource('email');
                  setMedium('newsletter');
                }}
              >
                Use Template <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Link Generator & QR Codes</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </div>

      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generator">Link Generator</TabsTrigger>
          <TabsTrigger value="links">My Links</TabsTrigger>
          <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <Card>
            <CardHeader>
              <CardTitle>Create New Affiliate Link</CardTitle>
              <CardDescription>
                Generate trackable links with UTM parameters and QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-url">Product/Page URL (Optional)</Label>
                  <Input
                    id="product-url"
                    placeholder="https://injapanfood.com/products/..."
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Leave empty to link to homepage</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link-name">Link Name</Label>
                  <Input
                    id="link-name"
                    placeholder="e.g., Summer Sale Instagram"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign">Campaign</Label>
                  <Select value={campaign} onValueChange={setCampaign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.filter(c => c.status === 'active').map(c => (
                        <SelectItem key={c.id} value={c.name.toLowerCase().replace(/\s+/g, '_')}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Traffic Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medium">Medium</Label>
                  <Select value={medium} onValueChange={setMedium}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="cpc">CPC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="short-url"
                    checked={useShortUrl}
                    onCheckedChange={setUseShortUrl}
                  />
                  <Label htmlFor="short-url">Generate Short URL</Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={generateLink} className="flex-1">
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Link
                </Button>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Options
                </Button>
              </div>

              {generatedLinks.length > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Your latest link is ready!</p>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={generatedLinks[0].shortUrl} 
                          readOnly 
                          className="flex-1"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => copyToClipboard(generatedLinks[0].shortUrl)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Generated Links</CardTitle>
                <div className="flex gap-2">
                  <Input placeholder="Search links..." className="w-64" />
                  <Button variant="outline">Export CSV</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedLinks.map((link) => (
                  <Card key={link.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{link.name}</h4>
                          <Badge variant="outline">{link.source}</Badge>
                          <Badge variant="outline">{link.medium}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Input 
                            value={link.shortUrl} 
                            readOnly 
                            className="max-w-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(link.shortUrl)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MousePointer className="w-4 h-4 text-gray-500" />
                            <span>{link.clicks.toLocaleString()} clicks</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-gray-500" />
                            <span>{link.conversions} conversions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-500" />
                            <span>¥{link.revenue.toLocaleString()}</span>
                          </div>
                        </div>

                        <SocialShareButtons url={link.shortUrl} />
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-codes">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Generator</CardTitle>
              <CardDescription>
                Create QR codes for your affiliate links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedLinks.slice(0, 6).map((link) => (
                  <Card key={link.id} className="text-center">
                    <CardContent className="pt-6 space-y-4">
                      <h4 className="font-semibold">{link.name}</h4>
                      <div id={`qr-${link.id}`} className="flex justify-center">
                        <QRCode 
                          value={link.shortUrl} 
                          size={150}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {link.shortUrl}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadQRCode(link.id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(link.shortUrl)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Scans</p>
                          <p className="font-semibold">{link.clicks}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Conversions</p>
                          <p className="font-semibold">{link.conversions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Templates</CardTitle>
              <CardDescription>
                Use pre-configured templates for common scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickTemplates />

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Custom Templates</h3>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Create your own templates with pre-filled parameters for faster link generation.
                    Perfect for recurring campaigns or specific traffic sources.
                  </AlertDescription>
                </Alert>
                <Button className="mt-4" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LinkGenerator;
