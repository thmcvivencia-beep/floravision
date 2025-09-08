
"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { identifyPlant, type IdentifyPlantOutput } from "@/ai/flows/identify-plant";
import { analyzePlantHealth, type AnalyzePlantHealthOutput } from "@/ai/flows/analyze-plant-health";
import { Leaf, HeartPulse, Sparkles, Bot, Loader2, Image as ImageIcon, XCircle, Camera, AlertTriangle, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";
import TutorialDialog from "./tutorial-dialog";

const FroApp: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [identification, setIdentification] = useState<IdentifyPlantOutput | null>(null);
  const [healthAnalysis, setHealthAnalysis] = useState<AnalyzePlantHealthOutput | null>(null);
  const [careTips, setCareTips] = useState<string | null>(null);

  const [isLoadingIdentification, setIsLoadingIdentification] = useState(false);
  const [isLoadingHealthAnalysis, setIsLoadingHealthAnalysis] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  
  const [currentAiTask, setCurrentAiTask] = useState<string | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [showUploadFallback, setShowUploadFallback] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    // ComponentDidMount: Check if the tutorial has been seen.
    const tutorialSeen = localStorage.getItem('fro-tutorial-seen');
    if (tutorialSeen !== 'true') {
      setIsTutorialOpen(true);
    }
  }, []);

  const { toast } = useToast();

  const stopVideoStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    // This effect now only handles cleanup of object URLs to prevent memory leaks.
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    // This effect handles stopping the video stream when the component unmounts.
    return () => {
      stopVideoStream();
    };
  }, [stopVideoStream]);


  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const resetResults = () => {
    setIdentification(null);
    setHealthAnalysis(null);
    setCareTips(null);
    setCurrentAiTask(null);
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (showUploadFallback) setShowUploadFallback(false);
    stopVideoStream();
    const file = event.target.files?.[0];
    if (file) {
      if (previewUrl && previewUrl.startsWith("blob:") && !previewUrl.startsWith("data:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      try {
        const dataUri = await fileToDataUri(file);
        setPreviewUrl(dataUri);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao ler o arquivo.",
          variant: "destructive",
        });
        setSelectedFile(null);
        setPreviewUrl(null);
      }
      resetResults();
    }
  };

  const startVideoStream = useCallback(async (deviceId?: string) => {
    stopVideoStream();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Erro de Câmera",
        description: "Seu navegador não suporta acesso à câmera. Por favor, envie um arquivo.",
        variant: "destructive",
      });
      setHasCameraPermission(false);
      setIsCameraDialogOpen(false);
      setShowUploadFallback(true);
      return;
    }
  
    setHasCameraPermission(null);
  
    const getStream = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
  
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
  
      const currentStreamDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId;
      if (currentStreamDeviceId) {
        const currentIndex = videoDevices.findIndex(device => device.deviceId === currentStreamDeviceId);
        if (currentIndex !== -1) {
          setCurrentCameraIndex(currentIndex);
        }
      } else if (videoDevices.length > 0) {
        setCurrentCameraIndex(0);
      }
    };
  
    try {
      if (deviceId) {
        await getStream({ video: { deviceId: { exact: deviceId } } });
      } else {
        try {
          await getStream({ video: { facingMode: 'environment' } });
        } catch (err) {
          console.warn("Falha ao obter a câmera traseira, tentando a padrão.", err);
          await getStream({ video: true });
        }
      }
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error);
      setHasCameraPermission(false);
      toast({
        variant: "destructive",
        title: "Acesso à Câmera Negado",
        description: "Por favor, habilite as permissões da câmera ou use a opção de envio de arquivo.",
      });
      setIsCameraDialogOpen(false);
      setShowUploadFallback(true);
    }
  }, [stopVideoStream, toast]);
  
  const handleDialogCameraOpenChange = (open: boolean) => {
    setIsCameraDialogOpen(open);
    if (open) {
      setHasCameraPermission(null);
      setSelectedFile(null);
      if (previewUrl && previewUrl.startsWith("blob:") && !previewUrl.startsWith("data:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null); 
      resetResults();
      startVideoStream();
    } else {
      stopVideoStream();
    }
  };
  
  const handleSwitchCamera = async () => {
    if (availableCameras.length > 1) {
      const nextCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextCameraIndex];
      await startVideoStream(nextCamera.deviceId);
    } else {
      toast({
        title: "Câmera Única",
        description: "Apenas uma câmera foi detectada.",
      });
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current ) return;
    
    setIsCapturingPhoto(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      if (previewUrl && previewUrl.startsWith("blob:") && !previewUrl.startsWith("data:")) {
         URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(dataUri); 
      setSelectedFile(null); 
      toast({ title: "Foto Capturada", description: "A imagem da câmera foi capturada." });
    } else {
       toast({ title: "Erro ao Capturar", description: "Não foi possível processar a imagem da câmera.", variant: "destructive" });
    }
    
    setIsCameraDialogOpen(false); 
    setIsCapturingPhoto(false);
  };


  const handleAnalyze = async () => {
    if (!previewUrl) { 
      toast({
        title: "Nenhuma Imagem",
        description: "Por favor, envie uma foto da planta ou capture uma com a câmera.",
        variant: "destructive",
      });
      return;
    }

    resetResults();

    try {
      setCurrentAiTask("Frô está identificando...");
      setIsLoadingIdentification(true);
      const identResult = await identifyPlant({ photoDataUri: previewUrl });
      
      // Robustness check: Ensure identResult is valid before proceeding
      if (!identResult || !identResult.commonName) {
        throw new Error("Não foi possível identificar a planta. Tente uma foto mais nítida ou de um ângulo diferente.");
      }
      
      setIdentification(identResult);
      setIsLoadingIdentification(false);
      toast({ title: "Planta Identificada", description: identResult.commonName });

      setCurrentAiTask("Frô está analisando a saúde...");
      setIsLoadingHealthAnalysis(true);
      const healthResult = await analyzePlantHealth({
        photoDataUri: previewUrl,
        description: identResult.description || "Imagem da planta",
      });
      setHealthAnalysis(healthResult);
      setCareTips(healthResult.careTips); // Save care tips from health analysis
      setIsLoadingHealthAnalysis(false);
      toast({ title: "Saúde Analisada", description: healthResult.isHealthy ? "A planta parece saudável." : "A planta pode precisar de atenção." });
      
    } catch (error: any) {
      console.error("Análise falhou:", error);
      toast({
        title: "Análise Falhou",
        description: error.message || "Ocorreu um erro inesperado durante a análise.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingIdentification(false);
      setIsLoadingHealthAnalysis(false);
      setCurrentAiTask(null);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith("blob:") && !previewUrl.startsWith("data:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    resetResults();
    if (isCameraDialogOpen) setIsCameraDialogOpen(false); 
    stopVideoStream();
    setHasCameraPermission(null);
    setAvailableCameras([]);
    setCurrentCameraIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const isLoading = isLoadingIdentification || isLoadingHealthAnalysis || isCapturingPhoto;

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
            {previewUrl ? (
                <div className="w-full">
                    <h3 className="text-xl font-headline mb-2 text-center">Prévia da Imagem</h3>
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
                    <ImageIcon size={48} className="mx-auto mb-2" />
                    <p>A imagem capturada aparecerá aqui.</p>
                </div>
            )}
          </div>
          
          <Dialog open={isCameraDialogOpen} onOpenChange={handleDialogCameraOpenChange}>
            <DialogTrigger asChild>
              <Button disabled={isLoading} className="w-full">
                <Camera className="mr-2 h-5 w-5" /> Usar Câmera
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-4 h-auto max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl">Câmera</DialogTitle>
              </DialogHeader>
              <div className="flex-grow overflow-hidden rounded-md border relative">
                <video 
                  ref={videoRef} 
                  className={cn(
                    "w-full h-full object-cover"
                  )}
                  autoPlay 
                  playsInline 
                  muted 
                />
                 {hasCameraPermission === null && isCameraDialogOpen && ( 
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-foreground">Solicitando permissão da câmera...</p>
                    </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <DialogFooter className="mt-4 gap-2 sm:gap-0 flex-col sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                  {availableCameras.length > 1 && hasCameraPermission && (
                    <Button onClick={handleSwitchCamera} variant="secondary" disabled={isLoading || isCapturingPhoto}>
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
                  <Button onClick={handleCapturePhoto} disabled={isLoading || isCapturingPhoto || !hasCameraPermission}>
                    {isCapturingPhoto ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Capturando...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-5 w-5" /> Capturar Foto
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showUploadFallback} onOpenChange={setShowUploadFallback}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Problema com a Câmera</DialogTitle>
                <DialogDescription>
                  Não foi possível acessar a câmera. Como alternativa, por favor, envie um arquivo de imagem do seu dispositivo.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label htmlFor="plant-photo-fallback">Enviar Foto da Planta</Label>
                <Input
                  id="plant-photo-fallback"
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Fechar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 flex flex-col sm:flex-row justify-between items-center gap-4">
           <Button 
            onClick={handleAnalyze} 
            disabled={!previewUrl || isLoading || isCameraDialogOpen} 
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading && !isCapturingPhoto ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {currentAiTask || "Analisando..."}
              </>
            ) : (
              <>
                <Bot className="mr-2 h-5 w-5" />
                Analisar com a Frô
              </>
            )}
          </Button>
          { (selectedFile || previewUrl) && (
            <Button 
              onClick={handleClear} 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              <XCircle className="mr-2 h-5 w-5" /> Limpar Tudo
            </Button>
          )}
        </CardFooter>
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
            {careTips && (
              <div>
                <strong className="font-medium">Conselhos Imediatos de Cuidado:</strong>
                <p className="text-muted-foreground mt-1">{careTips}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FroApp;
