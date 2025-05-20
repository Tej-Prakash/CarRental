
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
  initialPrice: z.number().describe('The initial listed daily price of the rental.'),
  minNegotiablePrice: z.number().optional().describe('The minimum daily price the owner is willing to accept.'),
  maxNegotiablePrice: z.number().optional().describe('The maximum daily price the owner is asking (usually same as initialPrice).'),
  userInput: z.string().describe('The user input/message to the chatbot.'),
});
export type PriceNegotiationInput = z.infer<typeof PriceNegotiationInputSchema>;

const PriceNegotiationOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user.'),
  negotiatedPrice: z.number().describe('The negotiated daily price after the conversation.'),
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
  prompt: `You are a car rental price negotiation chatbot. Your goal is to negotiate the daily rental price with the user.

  Car Model: {{{carModel}}}
  Rental Days: {{{rentalDays}}}
  Initial Daily Price: {{{initialPrice}}}
  {{#if minNegotiablePrice}}
  Minimum Acceptable Daily Price: {{{minNegotiablePrice}}}
  {{/if}}
  {{#if maxNegotiablePrice}}
  Maximum Asking Daily Price: {{{maxNegotiablePrice}}} (This is usually the initial price)
  {{/if}}

  User Input: {{{userInput}}}

  Your primary goal is to reach a deal.
  Consider the car model, rental days, and user input to negotiate the price.
  If minNegotiablePrice and maxNegotiablePrice are provided, you MUST try to keep your offers within this range.
  If the user proposes a price below minNegotiablePrice, you should politely inform them it's too low and suggest a price closer to the minimum.
  If the user proposes a price above maxNegotiablePrice (which is unlikely if it's the initial price), you can accept or counter slightly lower if appropriate.
  You should provide a negotiated daily price in the response. The negotiated price should be a number.
  If you have provided the final offer (e.g., you've reached minNegotiablePrice or a price you won't go below), set isFinalOffer to true.
  Be friendly and professional. Try to make a deal, but don't go below the minNegotiablePrice if it's set.
  
  The format of your JSON response should be:
  {
    "response": "The chatbot response to the user.",
    "negotiatedPrice": The negotiated daily price after the conversation,
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
