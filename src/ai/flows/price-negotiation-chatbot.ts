
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
  rentalHours: z.number().describe('The number of hours the car will be rented for.'), // Changed from rentalDays
  initialHourlyPrice: z.number().describe('The initial listed hourly price of the rental.'), // Changed from initialPrice
  minNegotiablePrice: z.number().optional().describe('The minimum hourly price the owner is willing to accept.'), // Now hourly
  maxNegotiablePrice: z.number().optional().describe('The maximum hourly price the owner is asking.'), // Now hourly
  userInput: z.string().describe('The user input/message to the chatbot.'),
});
export type PriceNegotiationInput = z.infer<typeof PriceNegotiationInputSchema>;

const PriceNegotiationOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user.'),
  negotiatedPrice: z.number().describe('The negotiated hourly price after the conversation.'), // Now hourly
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
  prompt: `You are a car rental price negotiation chatbot. Your goal is to negotiate the hourly rental price with the user.

  Car Model: {{{carModel}}}
  Rental Duration: {{{rentalHours}}} hours
  Initial Hourly Price: {{{initialHourlyPrice}}}
  {{#if minNegotiablePrice}}
  Minimum Acceptable Hourly Price: {{{minNegotiablePrice}}}
  {{/if}}
  {{#if maxNegotiablePrice}}
  Maximum Asking Hourly Price: {{{maxNegotiablePrice}}} (This is usually the initial hourly price)
  {{/if}}

  User Input: {{{userInput}}}

  Your primary goal is to reach a deal.
  Consider the car model, rental duration (in hours), and user input to negotiate the price.
  If minNegotiablePrice and maxNegotiablePrice are provided, you MUST try to keep your offers within this range.
  If the user proposes an hourly price below minNegotiablePrice, you should politely inform them it's too low and suggest a price closer to the minimum.
  If the user proposes an hourly price above maxNegotiablePrice, you can accept or counter slightly lower if appropriate.
  You should provide a negotiated hourly price in the response. The negotiated price should be a number.
  If you have provided the final offer (e.g., you've reached minNegotiablePrice or a price you won't go below), set isFinalOffer to true.
  Be friendly and professional. Try to make a deal, but don't go below the minNegotiablePrice if it's set.
  
  The format of your JSON response should be:
  {
    "response": "The chatbot response to the user.",
    "negotiatedPrice": The negotiated hourly price after the conversation,
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
