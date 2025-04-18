'use client'; // Required for useState

import { useState, useEffect, useRef } from 'react'; // Added useEffect, useRef
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

// Define the shape of the WebSocket message payload
interface LogMessage {
  type: 'status' | 'error' | 'success' | 'log'; // Add more types as needed
  message: string;
  timestamp: string;
}

export default function Page() {
  const [isVncLoading, setIsVncLoading] = useState(true);
  // Assuming noVNC is served at this default path. Adjust if necessary.
  const vncUrl = "http://localhost:6080/vnc_lite.html";
  const [activityLog, setActivityLog] = useState<LogMessage[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null); // Ref to scroll to bottom

  // --- WebSocket Connection Effect ---
  useEffect(() => {
    const wsUrl = `ws://localhost:8080`; // Use the same port as the server
    console.log(`Attempting to connect WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Optionally send an initial message or identifier
      setActivityLog(prev => [...prev, { type: 'status', message: 'Log stream connected.', timestamp: new Date().toLocaleTimeString() }]);
    };

    ws.onmessage = (event) => {
      try {
        const data: { type: string; message: string } = JSON.parse(event.data.toString());
        console.log('WebSocket message received:', data);
        const newLog: LogMessage = {
          type: data.type as LogMessage['type'], // Basic type assertion
          message: data.message,
          timestamp: new Date().toLocaleTimeString()
        };
        setActivityLog(prev => [...prev, newLog]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, event.data);
        setActivityLog(prev => [...prev, { type: 'error', message: 'Received unparseable log message.', timestamp: new Date().toLocaleTimeString() }]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setActivityLog(prev => [...prev, { type: 'error', message: 'WebSocket connection error.', timestamp: new Date().toLocaleTimeString() }]);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason);
      setActivityLog(prev => [...prev, { type: 'status', message: `Log stream disconnected${event.reason ? `: ${event.reason}` : ''}.`, timestamp: new Date().toLocaleTimeString() }]);
      // Optional: Implement reconnection logic here if desired
    };

    // Cleanup function to close WebSocket on component unmount
    return () => {
      console.log('Closing WebSocket connection.');
      ws.close();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Scroll to bottom of log ---
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog]); // Scroll whenever log updates

  // --- Launch Browser Function --- (Basic fetch call)
  const handleLaunchBrowser = async () => {
    const urlInput = document.getElementById('jobUrl') as HTMLInputElement;
    const url = urlInput?.value;
    if (!url) {
      setActivityLog(prev => [...prev, { type: 'error', message: 'Please enter a Job Application URL.', timestamp: new Date().toLocaleTimeString() }]);
      return;
    }

    setActivityLog(prev => [...prev, { type: 'status', message: `Requesting browser launch for ${url}...`, timestamp: new Date().toLocaleTimeString() }]);
    try {
      const response = await fetch('/api/launch-browser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! Status: ${response.status}`);
      }
      // Success message will come via WebSocket
      console.log('Launch request successful:', result);
      // setActivityLog(prev => [...prev, { type: 'status', message: result.message || 'Launch request sent.', timestamp: new Date().toLocaleTimeString() }]);
    } catch (error: any) {
      console.error('Failed to launch browser:', error);
      setActivityLog(prev => [...prev, { type: 'error', message: `Launch failed: ${error.message}`, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

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
                  <Button className="mt-4 w-full" onClick={handleLaunchBrowser}>Launch Browser</Button>
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2 text-xs">
                   {/* Log messages area */}
                   {activityLog.map((log, index) => (
                     <p key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-green-500' : 'text-muted-foreground'}`}>
                       <span className="font-mono">[{log.timestamp}]</span> {log.message}
                     </p>
                   ))}
                   {/* Empty state */}
                   {activityLog.length === 0 && (
                      <p className="text-muted-foreground italic">Waiting for activity...</p>
                   )}
                   {/* Ref for scrolling */}
                   <div ref={logEndRef} />
                </CardContent>
              </Card>
            </div>

            <div className="flex-1">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Live Browser / Output</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {isVncLoading && (
                    <div className="flex flex-1 items-center justify-center bg-muted">
                      <p className="text-muted-foreground">Connecting to browser session...</p>
                    </div>
                  )}
                  <iframe
                    src={vncUrl}
                    onLoad={() => setIsVncLoading(false)}
                    title="noVNC Session"
                    className={`flex-1 w-full h-full border-0 ${isVncLoading ? 'hidden' : 'block'}`}
                    style={{ overflow: 'hidden' }}
                  ></iframe>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
