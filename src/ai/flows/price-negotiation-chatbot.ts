'use server';
/**
 * @fileOverview An AI-powered chatbot for negotiating car rental prices.
 *
 * - priceNegotiationChatbot - A function that handles the price negotiation process.
 * - PriceNegotiationInput - The input type for the priceNegotiationChatbot function.
 * - PriceNegotiationOutput - The return type for the priceNegotiationChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceNegotiationInputSchema = z.object({
  carModel: z.string().describe('The model of the car being rented.'),
  rentalDays: z.number().describe('The number of days the car will be rented for.'),
  initialPrice: z.number().describe('The initial price of the rental.'),
  userInput: z.string().describe('The user input/message to the chatbot.'),
});
export type PriceNegotiationInput = z.infer<typeof PriceNegotiationInputSchema>;

const PriceNegotiationOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user.'),
  negotiatedPrice: z.number().describe('The negotiated price after the conversation.'),
  isFinalOffer: z.boolean().describe('Whether the current offer is the final offer.'),
});
export type PriceNegotiationOutput = z.infer<typeof PriceNegotiationOutputSchema>;

export async function priceNegotiationChatbot(input: PriceNegotiationInput): Promise<PriceNegotiationOutput> {
  return priceNegotiationChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'priceNegotiationChatbotPrompt',
  input: {schema: PriceNegotiationInputSchema},
  output: {schema: PriceNegotiationOutputSchema},
  prompt: `You are a car rental price negotiation chatbot. Your goal is to negotiate the price with the user.

  Car Model: {{{carModel}}}
  Rental Days: {{{rentalDays}}}
  Initial Price: {{{initialPrice}}}

  User Input: {{{userInput}}}

  Consider the car model, rental days and user input to negotiate the price. 
  You should provide a negotiated price in the response. The negotiated price should be a number.
  If you have provided the final offer, set isFinalOffer to true.
  
  The format of your JSON resonse should be:
  {
    "response": "The chatbot response to the user.",
    "negotiatedPrice": The negotiated price after the conversation,
    "isFinalOffer": Whether the current offer is the final offer
  }`,
});

const priceNegotiationChatbotFlow = ai.defineFlow(
  {
    name: 'priceNegotiationChatbotFlow',
    inputSchema: PriceNegotiationInputSchema,
    outputSchema: PriceNegotiationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
