'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { clients } from '@/lib/data';

export function ClientSelector() {
  const [selectedClient, setSelectedClient] = React.useState(clients[0].id);

  return (
    <Select value={selectedClient} onValueChange={setSelectedClient}>
      <SelectTrigger className="w-full md:w-[180px] lg:w-[220px]">
        <SelectValue placeholder="Select a client" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
