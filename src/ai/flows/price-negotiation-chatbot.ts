
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
  minNegotiablePrice: z.number().optional().describe('The minimum hourly price the owner is willing to accept. This is an internal guideline for the chatbot and should NOT be revealed to the user.'), // Now hourly
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

  Here is some information about the car and rental request:
  Car Model: {{{carModel}}}
  Rental Duration: {{{rentalHours}}} hours
  Initial Hourly Price: {{{initialHourlyPrice}}}
  {{#if maxNegotiablePrice}}
  The current asking price is generally around {{{maxNegotiablePrice}}} per hour.
  {{/if}}

  User Input: {{{userInput}}}

  Your primary goal is to reach a deal.
  Consider the car model, rental duration (in hours), and user input to negotiate the price.

  You have an internal 'floor price' which is the absolute minimum hourly rate you can accept for this car (this corresponds to the 'minNegotiablePrice' you received in the input, if it was provided). 
  If this 'floor price' is set and the user proposes an hourly price below it, you must politely inform them that their offer is unfortunately too low to accept. **Under no circumstances should you reveal this 'floor price' or explicitly state what the minimum acceptable price is to the user.**
  Instead of revealing the floor price, you can:
  1. Make a counter-offer that is at or slightly above your 'floor price'.
  2. Simply state that the offer is too low and ask them to propose a higher price.
  3. If you are already at your 'floor price' and the user is not accepting, you can state this is your best offer (and set isFinalOffer to true).

  If no 'floor price' (minNegotiablePrice) is set for this car, negotiate based on the 'initialHourlyPrice' and the 'maxNegotiablePrice' (if available), using your best judgment to reach a fair deal.
  
  If a 'maxNegotiablePrice' is provided, you should generally try to keep your offers at or below this, but you can accept reasonable offers slightly above it if it helps secure the booking, especially if they are well above your 'floor price'.

  Be friendly and professional throughout the negotiation.
  You should always provide a 'negotiatedPrice' in your JSON response, which represents the current hourly price you are offering or agreeing to. This price should be a number.
  If you believe the current offer is the final one you can make (e.g., you've reached your 'floor price' or a price you won't go below), set 'isFinalOffer' to true.
  
  The format of your JSON response must be:
  {
    "response": "Your conversational response to the user.",
    "negotiatedPrice": The_current_negotiated_hourly_price_as_a_number,
    "isFinalOffer": true_or_false
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
