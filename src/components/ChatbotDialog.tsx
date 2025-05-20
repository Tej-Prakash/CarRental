
"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { priceNegotiationChatbot, PriceNegotiationInput } from '@/ai/flows/price-negotiation-chatbot';
import type { Car } from '@/types';
import { Bot, User, Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Removed AvatarImage as it's not used
import { useToast } from '@/hooks/use-toast';

interface ChatbotDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car;
  rentalDays?: number;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function ChatbotDialog({ isOpen, onOpenChange, car, rentalDays = 1 }: ChatbotDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState<number>(car.pricePerDay);
  const [isFinalOffer, setIsFinalOffer] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      let initialBotMessage = `Hello! I'm here to help you negotiate the price for the ${car.name}. The current daily price is $${car.pricePerDay}.`;
      if (car.minNegotiablePrice) {
        initialBotMessage += ` We might be able to go as low as $${car.minNegotiablePrice}/day.`;
      }
      initialBotMessage += ` Let's talk about a price for your ${rentalDays} day rental!`;
      
      setMessages([
        {
          id: 'initial-bot-message',
          sender: 'bot',
          text: initialBotMessage,
          timestamp: new Date(),
        }
      ]);
      setNegotiatedPrice(car.pricePerDay);
      setIsFinalOffer(false);
      setUserInput('');
    }
  }, [isOpen, car, rentalDays]);

  useEffect(() => {
    // Find the viewport element within ScrollArea
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading || isFinalOffer) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const chatbotInput: PriceNegotiationInput = {
        carModel: car.name,
        rentalDays: rentalDays,
        initialPrice: car.pricePerDay, // This is the listed daily price
        minNegotiablePrice: car.minNegotiablePrice,
        maxNegotiablePrice: car.maxNegotiablePrice || car.pricePerDay, // Default max to initial if not set
        userInput: newUserMessage.text,
      };
      
      const result = await priceNegotiationChatbot(chatbotInput);
      
      const newBotMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: result.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newBotMessage]);
      setNegotiatedPrice(result.negotiatedPrice); // This is the daily price from bot
      setIsFinalOffer(result.isFinalOffer);

      if (result.isFinalOffer) {
        toast({
          title: "Final Offer",
          description: `The current negotiated daily price of $${result.negotiatedPrice} is our best offer.`,
        });
      }

    } catch (error) {
      console.error("Chatbot error:", error);
      const errorBotMessage: Message = {
        id: `bot-error-${Date.now()}`,
        sender: 'bot',
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorBotMessage]);
      toast({
        title: "Chatbot Error",
        description: "Could not get a response from the negotiation assistant.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] flex flex-col h-[70vh] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bot className="h-6 w-6 mr-2 text-primary" /> Price Negotiation Assistant
          </DialogTitle>
          <DialogDescription>
            For {car.name}. Current daily price: ${negotiatedPrice}.
            {isFinalOffer && <span className="text-destructive font-semibold"> (Final Offer)</span>}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-4 border rounded-md my-4 bg-secondary/30" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-end space-x-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={18}/></AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground border'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs mt-1 opacity-70 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User size={18}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
                <div className="max-w-[70%] p-3 rounded-lg bg-card text-card-foreground border shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder={isFinalOffer ? "This is the final offer." : "Type your message..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading || isFinalOffer}
              className="flex-grow"
            />
            <Button onClick={handleSendMessage} disabled={isLoading || isFinalOffer || !userInput.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
