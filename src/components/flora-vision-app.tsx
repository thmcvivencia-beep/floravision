
"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { identifyPlant, type IdentifyPlantOutput } from "@/ai/flows/identify-plant";
import { analyzePlantHealth, type AnalyzePlantHealthOutput } from "@/ai/flows/analyze-plant-health";
import { Leaf, HeartPulse, Bot, Loader2, Image as ImageIcon, XCircle, Camera, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";
import TutorialDialog from "./tutorial-dialog";

const FroApp: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [identification, setIdentification] = useState<IdentifyPlantOutput | null>(null);
  const [healthAnalysis, setHealthAnalysis] = useState<AnalyzePlantHealthOutput | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentAiTask, setCurrentAiTask] = useState<string | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // ComponentDidMount: Check if the tutorial has been seen.
    const tutorialSeen = localStorage.getItem('fro-tutorial-seen');
    if (tutorialSeen !== 'true') {
      setIsTutorialOpen(true);
    }
  }, []);

  const stopVideoStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const resetResults = () => {
    setIdentification(null);
    setHealthAnalysis(null);
  };

  const handleAnalyze = async (dataUri: string) => {
    resetResults();
    setIsLoading(true);
    
    try {
      setCurrentAiTask("Frô está identificando...");
      const identResult = await identifyPlant({ photoDataUri: dataUri });
      if (!identResult?.commonName) {
        throw new Error("A identificação da planta falhou ou retornou um resultado inválido.");
      }
      
      setIdentification(identResult);
      toast({ title: "Planta Identificada", description: identResult.commonName });

      setCurrentAiTask("Frô está analisando a saúde...");
      
      const healthResult = await analyzePlantHealth({
        photoDataUri: dataUri,
        description: identResult.description || "Imagem da planta",
      });
      if (!healthResult) {
         throw new Error("A análise de saúde falhou ou retornou um resultado inválido.");
      }

      setHealthAnalysis(healthResult);
      toast({ title: "Saúde Analisada", description: healthResult.isHealthy ? "A planta parece saudável." : "A planta pode precisar de atenção." });

    } catch (error: any) {
      console.error("Análise falhou:", error);
      const errorMessage = "Não foi possível analisar a imagem. Tente uma foto mais nítida ou de um ângulo diferente. Verifique também sua chave de API e a conexão.";
      toast({
        title: "Análise Falhou",
        description: errorMessage,
        variant: "destructive",
      });
      // Clear results if analysis fails
      handleClear();
    } finally {
      setIsLoading(false);
      setCurrentAiTask(null);
    }
  };

  const startVideoStream = useCallback(async (deviceId?: string) => {
    stopVideoStream();
    setHasCameraPermission(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Erro de Câmera",
        description: "Seu navegador não suporta acesso à câmera.",
        variant: "destructive",
      });
      setIsCameraDialogOpen(false);
      return;
    }

    const constraints = deviceId 
      ? { video: { deviceId: { exact: deviceId } } }
      : { video: { facingMode: 'environment' } };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      const currentStreamDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId;
      const currentIndex = videoDevices.findIndex(device => device.deviceId === currentStreamDeviceId);
      setCurrentCameraIndex(currentIndex > -1 ? currentIndex : 0);
    } catch (error) {
       console.error("Erro ao acessar a câmera, tentando fallback:", error);
       try {
         // Fallback to any available camera
         const stream = await navigator.mediaDevices.getUserMedia({video: true});
         setHasCameraPermission(true);
         if (videoRef.current) videoRef.current.srcObject = stream;
       } catch (fallbackError) {
         console.error("Erro no fallback da câmera:", fallbackError);
         setHasCameraPermission(false);
         toast({
           variant: "destructive",
           title: "Acesso à Câmera Negado",
           description: "Por favor, habilite as permissões da câmera nas configurações do seu navegador.",
         });
         setIsCameraDialogOpen(false);
       }
    }
  }, [stopVideoStream, toast]);
  
  const handleDialogCameraOpenChange = (open: boolean) => {
    setIsCameraDialogOpen(open);
    if (open) {
      handleClear();
      startVideoStream();
    } else {
      stopVideoStream();
    }
  };
  
  const handleSwitchCamera = async () => {
    if (availableCameras.length > 1) {
      const nextCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      await startVideoStream(availableCameras[nextCameraIndex].deviceId);
    }
  };

  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isLoading) return;
    
    setIsLoading(true); // Set loading state immediately
    setCurrentAiTask("Capturando e analisando...");
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      setPreviewUrl(dataUri);
      
      // Close camera dialog and start analysis
      setIsCameraDialogOpen(false); 
      stopVideoStream();
      await handleAnalyze(dataUri); // Pass dataUri directly

    } else {
       toast({ title: "Erro ao Capturar", description: "Não foi possível processar a imagem da câmera.", variant: "destructive" });
       setIsLoading(false); // Reset loading state on error
       setCurrentAiTask(null);
    }
  };


  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    resetResults();
    stopVideoStream();
    setHasCameraPermission(null);
  };

  return (
    <div className="space-y-8">
      <TutorialDialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen} />
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-secondary/50 p-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <CardTitle className="text-3xl font-headline text-primary-foreground flex items-center">
                    <Leaf className="mr-3 h-8 w-8 text-primary-foreground/80" />
                    Frô
                </CardTitle>
            </div>
          <CardDescription className="text-muted-foreground text-lg pt-2">
            Use a câmera para que a Frô, nossa IA botânica, identifique sua planta, analise a saúde e forneça dicas de cuidados.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="p-4 border border-dashed border-border rounded-lg bg-muted/20 min-h-[250px] flex items-center justify-center">
            {previewUrl && !isLoading ? (
                <div className="w-full">
                    <h3 className="text-xl font-headline mb-2 text-center">Planta a ser Analisada</h3>
                    <div className="relative w-full aspect-video max-h-[400px] rounded-md overflow-hidden shadow-md">
                        <Image 
                        src={previewUrl} 
                        alt="Prévia da planta" 
                        fill
                        className="object-cover" 
                        data-ai-hint="planta vaso" 
                        />
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                        <p>{currentAiTask || "Analisando..."}</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={48} className="mx-auto mb-2" />
                        <p>A imagem capturada aparecerá aqui.</p>
                      </>
                    )}
                </div>
            )}
          </div>
          
          <Dialog open={isCameraDialogOpen} onOpenChange={handleDialogCameraOpenChange}>
            <DialogTrigger asChild>
              <Button disabled={isLoading} className="w-full" size="lg">
                <Camera className="mr-2 h-5 w-5" /> Iniciar Análise com a Câmera
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-4 h-auto max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl">Câmera</DialogTitle>
              </DialogHeader>
              <div className="flex-grow overflow-hidden rounded-md border relative">
                <video 
                  ref={videoRef} 
                  className={cn("w-full h-full object-cover")}
                  autoPlay 
                  playsInline 
                  muted 
                />
                 {hasCameraPermission === null && isCameraDialogOpen && ( 
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-foreground">Iniciando câmera...</p>
                    </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <DialogFooter className="mt-4 gap-2 sm:gap-0 flex-col sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                  {availableCameras.length > 1 && hasCameraPermission && (
                    <Button onClick={handleSwitchCamera} variant="secondary" disabled={isLoading}>
                      <SwitchCamera className="mr-2 h-5 w-5" /> Trocar Câmera
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                    <DialogClose asChild>
                    <Button variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button onClick={handleCaptureAndAnalyze} disabled={isLoading || !hasCameraPermission}>
                    <Camera className="mr-2 h-5 w-5" /> Capturar e Analisar
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>

        {(previewUrl || identification || healthAnalysis) && (
            <CardFooter className="p-6 bg-secondary/50">
                <Button 
                onClick={handleClear} 
                variant="outline" 
                size="lg"
                className="w-full"
                disabled={isLoading}
                >
                <XCircle className="mr-2 h-5 w-5" /> Nova Análise
                </Button>
            </CardFooter>
        )}
      </Card>

      {identification && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center"><Leaf className="mr-2 text-primary h-6 w-6" /> Identificação da Planta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-lg">
            <p><strong className="font-medium">Nome Comum:</strong> {identification.commonName}</p>
            <p><strong className="font-medium">Nome Científico:</strong> <em className="font-italic">{identification.latinName}</em></p>
            <div>
              <strong className="font-medium">Descrição:</strong>
              <p className="text-muted-foreground mt-1">{identification.description}</p>
            </div>
            <div>
              <strong className="font-medium">Confiança:</strong> {Math.round(identification.confidence * 100)}%
              <Progress value={identification.confidence * 100} className="mt-1 h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {healthAnalysis && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center"><HeartPulse className="mr-2 text-primary h-6 w-6" /> Análise de Saúde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-lg">
            <p><strong className="font-medium">Estado de Saúde:</strong> {healthAnalysis.isHealthy ? 
              <span className="text-green-600 font-semibold">Saudável</span> : 
              <span className="text-red-600 font-semibold">Requer Atenção</span>}
            </p>
            <div>
              <strong className="font-medium">Diagnóstico:</strong>
              <p className="text-muted-foreground mt-1">{healthAnalysis.diagnosis}</p>
            </div>
            {healthAnalysis.careTips && (
              <div>
                <strong className="font-medium">Conselhos Imediatos de Cuidado:</strong>
                <p className="text-muted-foreground mt-1">{healthAnalysis.careTips}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FroApp;

    