
"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Bot, Sparkles } from "lucide-react";

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSteps = [
  {
    icon: Camera,
    title: "1. Capture sua Planta",
    description: "Use a câmera do seu celular ou envie uma foto da sua planta. Tente obter uma imagem clara e bem iluminada.",
    image: "https://i.imgur.com/4EbHFCN_d.webp?maxwidth=520&shape=thumb&fidelity=high",
    aiHint: "potted plant"
  },
  {
    icon: Bot,
    title: "2. Análise com a Frô",
    description: "Nossa IA, a Frô, identificará a espécie da sua planta e analisará sua saúde, procurando por sinais de problemas.",
    image: "https://i.imgur.com/TQ5aS7S_d.webp?maxwidth=520&shape=thumb&fidelity=high",
    aiHint: "plant analysis"
  },
  {
    icon: Sparkles,
    title: "3. Receba Dicas",
    description: "Você receberá um guia de cuidados completo, com dicas de rega, luz, solo e como resolver problemas específicos.",
    image: "https://i.imgur.com/IcvY8G2_d.webp?maxwidth=520&shape=thumb&fidelity=high",
    aiHint: "care tips"
  },
];

const TutorialDialog: React.FC<TutorialDialogProps> = ({ open, onOpenChange }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('fro-tutorial-seen', 'true');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Bem-vindo(a) à Frô!</DialogTitle>
          <DialogDescription className="text-center">
            Veja como é fácil cuidar das suas plantas.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-72 w-full pr-4">
            <div className="space-y-6">
                {tutorialSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center justify-center p-1 space-y-4 text-center">
                    <div className="flex items-center gap-4 w-full">
                        <div className="p-3 bg-primary/20 rounded-full">
                           <step.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg">{step.title}</h3>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                    </div>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden mt-2">
                       <Image 
                         src={step.image} 
                         alt={step.title} 
                         fill
                         className="object-cover"
                         data-ai-hint={step.aiHint}
                       />
                    </div>
                </div>
                ))}
            </div>
        </ScrollArea>

        <DialogFooter className="flex-col space-y-4 pt-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label htmlFor="dont-show-again" className="text-sm">
              Não mostrar novamente
            </Label>
          </div>
          <Button onClick={handleClose}>Entendi!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDialog;
