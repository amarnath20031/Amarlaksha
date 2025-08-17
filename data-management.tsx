import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText
} from "lucide-react";

interface DataImport {
  id: number;
  fileName: string;
  fileType: string;
  sourceApp: string;
  recordsProcessed: number;
  recordsImported: number;
  recordsSkipped: number;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  userEmail: string;
}



export default function DataManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceApp, setSourceApp] = useState('generic');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();



  // Fetch import history with proper typing
  const { data: imports = [], isLoading: importsLoading } = useQuery<DataImport[]>({
    queryKey: ['/api/imports'],
  });



  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('📤 Making import request to /api/import');
      
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      console.log('📤 Import response status:', response.status);
      console.log('📤 Import response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const error = await response.json();
        console.log('❌ Import error response:', error);
        throw new Error(error.message || 'Import failed');
      }
      
      const result = await response.json();
      console.log('✅ Import success response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 Import mutation success:', data);
      toast({
        title: "Import Successful",
        description: data.message,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/spending'] });
      setSelectedFile(null);
      setIsUploading(false);
    },
    onError: (error: Error) => {
      console.log('❌ Import mutation error:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 File selected:', file);
    
    if (file) {
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json'
      ];
      
      // Also accept files without MIME type (common on mobile)
      const isValidExtension = file.name.toLowerCase().match(/\.(csv|xlsx|xls|json)$/);
      
      if (validTypes.includes(file.type) || isValidExtension) {
        setSelectedFile(file);
        toast({
          title: "File Selected",
          description: `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        });
      } else {
        console.log('❌ Invalid file type:', file.type, 'Extension check:', isValidExtension);
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV, Excel (.xlsx), or JSON file.",
          variant: "destructive",
        });
      }
    } else {
      console.log('❌ No file selected');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import first.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('📤 Starting import:', {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      sourceApp: sourceApp
    });
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('sourceApp', sourceApp);
    
    // Log FormData contents
    console.log('📤 FormData contents:');
    const entries = Array.from(formData.entries());
    entries.forEach(([key, value]) => {
      console.log(`  ${key}:`, value);
    });
    
    importMutation.mutate(formData);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/export/${format}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `laksha-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Your data has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Management</h1>
          <p className="text-gray-600">Import, export, and manage your financial data</p>
        </div>

        {/* Data Backup & Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Backup & Export
            </CardTitle>
            <CardDescription>
              Download your expense data for backup or migration to other apps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleExport('json')}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                <FileJson className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Export as JSON</div>
                  <div className="text-sm text-gray-500">Complete data with metadata</div>
                </div>
              </Button>
              
              <Button
                onClick={() => handleExport('csv')}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Export as CSV</div>
                  <div className="text-sm text-gray-500">Spreadsheet compatible</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import from Other Apps
            </CardTitle>
            <CardDescription>
              Import your expense history from Spendee, Walnut, or other financial apps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sourceApp">Source App</Label>
                <Select value={sourceApp} onValueChange={setSourceApp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source app" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spendee">Spendee</SelectItem>
                    <SelectItem value="walnut">Walnut</SelectItem>
                    <SelectItem value="generic">Generic CSV/Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="file">Upload File</Label>
                <div className="space-y-2">
                  <input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="text-xs text-gray-500">
                    Supported formats: CSV, Excel (.xlsx), JSON
                  </div>
                </div>
              </div>
            </div>
            
            {selectedFile && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Ready to import: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>



        {/* Import History */}
        {imports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                Recent data imports and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {imports.map((importItem: DataImport) => (
                  <div
                    key={importItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{importItem.fileName}</span>
                        <Badge
                          variant={
                            importItem.status === 'completed' ? 'default' :
                            importItem.status === 'failed' ? 'destructive' : 'secondary'
                          }
                        >
                          {importItem.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {importItem.status === 'completed' && (
                          <>
                            {importItem.recordsImported} imported, {importItem.recordsSkipped} skipped
                            {importItem.recordsProcessed > 0 && (
                              <span className="ml-2">
                                ({Math.round((importItem.recordsImported / importItem.recordsProcessed) * 100)}% success)
                              </span>
                            )}
                          </>
                        )}
                        {importItem.status === 'failed' && importItem.errorMessage && (
                          <span className="text-red-600">{importItem.errorMessage}</span>
                        )}
                        {importItem.status === 'processing' && (
                          <span>Processing...</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(importItem.createdAt)} • from {importItem.sourceApp}
                      </div>
                    </div>
                    {importItem.status === 'completed' && importItem.recordsProcessed > 0 && (
                      <div className="w-24">
                        <Progress
                          value={(importItem.recordsImported / importItem.recordsProcessed) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
}

