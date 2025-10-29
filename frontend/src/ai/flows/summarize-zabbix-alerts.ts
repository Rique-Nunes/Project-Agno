'use server';
/**
 * @fileOverview Summarizes Zabbix alerts to provide a quick understanding of issues.
 *
 * - summarizeZabbixAlerts - A function that summarizes Zabbix alerts.
 * - SummarizeZabbixAlertsInput - The input type for the summarizeZabbixAlerts function.
 * - SummarizeZabbixAlertsOutput - The return type for the summarizeZabbixAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeZabbixAlertsInputSchema = z.object({
  alerts: z.string().describe('A list of Zabbix alerts.'),
});
export type SummarizeZabbixAlertsInput = z.infer<typeof SummarizeZabbixAlertsInputSchema>;

const SummarizeZabbixAlertsOutputSchema = z.object({
  summary: z.string().describe('A summary of the Zabbix alerts.'),
});
export type SummarizeZabbixAlertsOutput = z.infer<typeof SummarizeZabbixAlertsOutputSchema>;

export async function summarizeZabbixAlerts(input: SummarizeZabbixAlertsInput): Promise<SummarizeZabbixAlertsOutput> {
  return summarizeZabbixAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeZabbixAlertsPrompt',
  input: {schema: SummarizeZabbixAlertsInputSchema},
  output: {schema: SummarizeZabbixAlertsOutputSchema},
  prompt: `You are an expert in summarizing Zabbix alerts.

  Please provide a concise summary of the following alerts:

  Alerts: {{{alerts}}}
  `,
});

const summarizeZabbixAlertsFlow = ai.defineFlow(
  {
    name: 'summarizeZabbixAlertsFlow',
    inputSchema: SummarizeZabbixAlertsInputSchema,
    outputSchema: SummarizeZabbixAlertsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
