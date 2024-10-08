import { useContext, useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { useNavigate, useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Save,
  Download,
  ExternalLink,
  Code,
  MessageSquare,
  Columns2,
  Rows2,
  Maximize2,
  Smartphone,
  ChevronLeft,
  Files,
  Undo2,
  Redo2,
} from "lucide-react";
import { useSocket } from "@/context/SocketProvider";
import { AuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProject } from "@/hooks/useProject";
import IframePreview, { DEVICE_FRAMES } from "@/components/IframePreview";
import Dice from "@/components/random/Dice";
import Chat from "@/components/Chat";
import AssetUploader from "@/components/AssetUploader";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ViewOptions = ({ currentView, onViewChange }) => {
  const views = [
    { id: "horizontal", icon: Columns2, tooltip: "Horizontal View" },
    { id: "vertical", icon: Rows2, tooltip: "Vertical View" },
    { id: "mobile", icon: Smartphone, tooltip: "Mobile View" },
    { id: "fullscreen", icon: Maximize2, tooltip: "Fullscreen View" },
  ];

  return (
    <div className="flex">
      {views.map((view, index) => (
        <Tooltip key={view.id}>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === view.id ? "default" : "outline"}
              size="icon"
              onClick={() => onViewChange(view.id)}
              className={`w-10 h-10 px-2 ${
                index === 0
                  ? "rounded-l-md rounded-r-none"
                  : index === views.length - 1
                  ? "rounded-r-md rounded-l-none"
                  : "rounded-none"
              } ${index !== 0 ? "-ml-px" : ""}`}
            >
              <view.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{view.tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

const Edit = () => {
  const navigate = useNavigate();
  const { user, userLoading } = useContext(AuthContext);
  const previewContainerRef = useRef(null);
  const { socket } = useSocket();

  const { shipId } = useParams();

  const { readFile, updateFile, submitting, handledownloadzip } =
    useProject(shipId);

  const [fileContent, setFileContent] = useState("");
  const [isFileLoading, setIsFileLoading] = useState(false);
  const iframeRef = useRef(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [currentDevice, setCurrentDevice] = useState(DEVICE_FRAMES[0]);
  const [activeTab, setActiveTab] = useState("chat");
  const [currentView, setCurrentView] = useState("horizontal");
  const [hasShownErrorToast, setHasShownErrorToast] = useState(false);

  useEffect(() => {
    if (!userLoading && (!user || !shipId)) {
      navigate("/");
    } else {
      // Load index.html content when the component mounts
      loadIndexHtml();
    }
  }, [user, shipId, navigate, userLoading]);

  useEffect(() => {
    const preventScroll = (e) => {
      if (currentView !== "fullscreen" && currentView !== "mobile") {
        e.preventDefault();
      }
    };

    const container = previewContainerRef.current;
    if (container) {
      container.addEventListener("wheel", preventScroll, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", preventScroll);
      }
    };
  }, [currentView]);

  const loadIndexHtml = async () => {
    setIsFileLoading(true);
    setHasShownErrorToast(false); // Reset the flag before loading
    try {
      const content = await readFile(`${shipId}/index.html`);
      setFileContent(content);
    } catch (error) {
      console.error("Failed to read index.html:", error);
      if (!hasShownErrorToast) {
        toast.error("Failed to load index.html");
        setHasShownErrorToast(true);
      }
    } finally {
      setIsFileLoading(false);
    }
    setUnsavedChanges(false);
  };

  const handleFileChange = (value) => {
    setFileContent(value);
    setUnsavedChanges(true);
  };

  const handleFileSave = async () => {
    updateFile(`${shipId}/index.html`, fileContent, () => {
      toast.success("index.html updated!", {
        description: "Your changes are live 👍",
      });
      if (iframeRef.current) {
        iframeRef.current.reload();
      }
      setUnsavedChanges(false);
    });
  };

  const handleCodeUpdate = (updatedCode) => {
    setFileContent(updatedCode);
    setUnsavedChanges(false);
  };

  const shuffleDevice = () => {
    const newDevice =
      DEVICE_FRAMES[Math.floor(Math.random() * DEVICE_FRAMES.length)];
    setCurrentDevice(newDevice);
    toast(`Congratulations! 🎉`, {
      description: `You've changed the device to ${newDevice}`,
      position: "bottom-right",
      duration: 1500,
    });
  };

  const handleUndo = () => {
    socket.emit("undoCodeChange", { shipId });
  };

  const handleRedo = () => {
    socket.emit("redoCodeChange", { shipId });
  };

  const handleUndoResult = (result) => {
    if (result.success) {
      toast.success(result.message);
      setFileContent(result.code);
      if (iframeRef.current) {
        iframeRef.current.reload();
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleRedoResult = (result) => {
    if (result.success) {
      toast.success(result.message);
      setFileContent(result.code);
      if (iframeRef.current) {
        iframeRef.current.reload();
      }
    } else {
      toast.error(result.message);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("undoResult", handleUndoResult);
      socket.on("redoResult", handleRedoResult);
      socket.on("codeUpdate", handleCodeUpdate);

      return () => {
        socket.off("undoResult", handleUndoResult);
        socket.off("redoResult", handleRedoResult);
        socket.off("codeUpdate", handleCodeUpdate);
      };
    }
  }, [socket]);

  if (!user || !shipId) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto flex flex-col h-screen p-4 bg-background text-foreground">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/" className="text-foreground hover:text-primary">
                  <ChevronLeft className="w-6 h-6" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Back to Projects</TooltipContent>
            </Tooltip>
            <h1 className="text-xl font-semibold">{shipId}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleUndo}
                    className="w-10 h-10 px-2 rounded-l-md rounded-r-none"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRedo}
                    className="w-10 h-10 px-2 rounded-l-none rounded-r-md -ml-px"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>
            <Separator orientation="vertical" className="h-8 mx-2" />
            <ViewOptions
              currentView={currentView}
              onViewChange={setCurrentView}
            />
            <Separator orientation="vertical" className="h-8 mx-2" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  className="h-10 px-2"
                  onClick={() => {
                    window.open(
                      `${import.meta.env.VITE_BACKEND_URL}/site/${shipId}/`,
                      "_blank"
                    );
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in New Tab</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="h-10 px-2 bg-green-500 hover:bg-green-600"
                  onClick={() => {
                    handledownloadzip();
                    toast("Project will be downloaded shortly!");
                  }}
                >
                  <Download className="w-4 h-4 " />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download Project</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <ResizablePanelGroup
          direction={currentView === "vertical" ? "vertical" : "horizontal"}
          className="flex-1 overflow-hidden rounded-lg border border-border"
        >
          {currentView !== "fullscreen" && (
            <ResizablePanel defaultSize={30} minSize={30}>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="h-full flex flex-col"
              >
                <div className="bg-card p-2 flex justify-between items-center">
                  <TabsList>
                    <TabsTrigger value="chat" className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      AI Chat
                    </TabsTrigger>
                    <TabsTrigger value="code" className="flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="assets" className="flex items-center">
                      <Files className="w-4 h-4 mr-2" />
                      Assets
                    </TabsTrigger>
                  </TabsList>
                  {activeTab === "code" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={submitting}
                          onClick={handleFileSave}
                          className="text-muted-foreground hover:text-foreground border-border hover:bg-accent"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save Changes</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <TabsContent value="chat" className="flex-grow overflow-hidden">
                  <Chat shipId={shipId} onCodeUpdate={handleCodeUpdate} />
                </TabsContent>
                <TabsContent value="code" className="flex-grow overflow-hidden">
                  <div className="h-full flex flex-col bg-background">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <span className="font-bold text-foreground">
                        index.html
                      </span>
                      {unsavedChanges && (
                        <Badge variant="secondary">Unsaved changes</Badge>
                      )}
                    </div>
                    {isFileLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="relative w-16 h-16">
                          <div className="absolute top-0 left-0 w-full h-full border-4 border-muted rounded-full animate-pulse"></div>
                          <div className="absolute top-0 left-0 w-full h-full border-t-4 border-primary rounded-full animate-spin"></div>
                        </div>
                      </div>
                    ) : (
                      <Editor
                        language="html"
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          scrollbar: {
                            vertical: "visible",
                            horizontal: "visible",
                          },
                          fontSize: 14,
                          lineNumbers: "on",
                          glyphMargin: false,
                          folding: true,
                          lineDecorationsWidth: 0,
                          lineNumbersMinChars: 3,
                          renderLineHighlight: "all",
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                        value={fileContent}
                        onChange={handleFileChange}
                      />
                    )}
                  </div>
                </TabsContent>
                <TabsContent
                  value="assets"
                  className="flex-grow overflow-hidden"
                >
                  <AssetUploader shipId={shipId} />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          )}
          {currentView !== "fullscreen" && <ResizableHandle withHandle />}
          <ResizablePanel defaultSize={currentView === "fullscreen" ? 100 : 70}>
            <div ref={previewContainerRef} className="h-full overflow-hidden">
              <IframePreview
                device={currentView === "mobile" ? currentDevice : null}
                ref={iframeRef}
                slug={shipId}
                currentView={currentView}
                isLoading={isFileLoading}
              />
              {currentView === "mobile" && (
                <div className="absolute bottom-8 right-8 z-10">
                  <Dice onRoll={shuffleDevice} />
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
};

export default Edit;
