import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
// Placeholder for an icon component (replace with actual library like lucide-react)
// import { UploadCloud } from 'lucide-react';

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 flex-row gap-4 md:gap-6">
            <div className="w-1/3 flex flex-col gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-6 h-48 rounded-md border-2 border-dashed border-muted-foreground/50 bg-muted/50 text-center">
                    <div className="mb-4 h-10 w-10 text-muted-foreground">
                       {/* Replace with actual Icon component e.g., <UploadCloud className="h-10 w-10" /> */}
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                       </svg>
                    </div>
                    <p className="text-sm font-medium mb-1">Click or drag & drop documents here to upload</p>
                    <p className="text-xs text-muted-foreground">Supported document types: PDF, DOC, DOCX, TXT.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Job Application URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="jobUrl" className="sr-only">Job Application URL</Label>
                  <Input id="jobUrl" type="url" placeholder="Paste job application URL here..." />
                  <p className="text-xs text-muted-foreground mt-6">Example URLs:</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 mt-1 space-y-0.5">
                     <li>https://boards.greenhouse.io/example/jobs/12345</li>
                     <li>https://jobs.lever.co/example/12345</li>
                     <li>https://careers.example.com/apply</li>
                  </ul>
                  <Button className="mt-4 w-full">Launch Browser</Button>
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40 overflow-y-auto rounded border border-dashed bg-muted p-2 text-sm text-muted-foreground">
                    <p>Agent activity will appear here...</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Live Browser / Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Right card content goes here (e.g., embedded browser, results).</p>
                  <div className="mt-4 h-96 rounded border border-dashed bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">Browser Area</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
