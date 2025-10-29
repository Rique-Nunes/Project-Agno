// Use server directive is required when using Genkit.
'use server';

/**
 * @fileOverview Implements the AI-Powered Querying feature, allowing users to ask questions in natural language about Zabbix data.
 *
 * - aiPoweredQuery - A function that accepts a natural language question and returns a structured response with text and chart data.
 * - AIPoweredQueryInput - The input type for the aiPoweredQuery function.
 * - AIPoweredQueryOutput - The return type for the aiPoweredQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPoweredQueryInputSchema = z.object({
  question: z.string().describe('The natural language question about Zabbix data.'),
  clientId: z.string().describe('The ID of the client whose Zabbix data is being queried.'),
});
export type AIPoweredQueryInput = z.infer<typeof AIPoweredQueryInputSchema>;

const AIPoweredQueryOutputSchema = z.object({
  text: z.string().describe('The natural language response to the question.'),
  chartData: z.any().describe('The chart data in JSON format.'),
  status: z.string().describe('The status of the queried system (e.g., Normal, Warning, Critical).'),
});
export type AIPoweredQueryOutput = z.infer<typeof AIPoweredQueryOutputSchema>;

export async function aiPoweredQuery(input: AIPoweredQueryInput): Promise<AIPoweredQueryOutput> {
  return aiPoweredQueryFlow(input);
}

const aiPoweredQueryPrompt = ai.definePrompt({
  name: 'aiPoweredQueryPrompt',
  input: {schema: AIPoweredQueryInputSchema},
  output: {schema: AIPoweredQueryOutputSchema},
  prompt: `You are an AI assistant that answers question about Zabbix monitoring data for a specific client.

  You have access to Zabbix metrics and their current status for the specified client.

  Based on the user's question and the available data, provide a clear and concise answer.

  If the question asks for specific metrics, include the corresponding chart data in the response.

  Here's the question: {{{question}}}
  Client ID: {{{clientId}}}

  Format your response as a JSON object with the following fields:
  - text: The natural language response to the question.
  - chartData: The chart data in JSON format (can be an empty object if not applicable).
  - status: The status of the queried system (e.g., Normal, Warning, Critical).`,
});

const aiPoweredQueryFlow = ai.defineFlow(
  {
    name: 'aiPoweredQueryFlow',
    inputSchema: AIPoweredQueryInputSchema,
    outputSchema: AIPoweredQueryOutputSchema,
  },
  async input => {
    const {output} = await aiPoweredQueryPrompt(input);
    return output!;
  }
);
