import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function DemoInfo() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-blue-800 text-sm">
          <strong>Quick Start:</strong> 
          <br />• Enter any email address to continue
          <br />• No verification required - instant access
          <br />• Your account is created automatically
        </div>
      </CardContent>
    </Card>
  );
}