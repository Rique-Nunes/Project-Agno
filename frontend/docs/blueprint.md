# **App Name**: ZabbixAI Dashboard

## Core Features:

- Client Management: Allow admin users to register and manage multiple Zabbix client integrations, storing credentials securely in Firestore.
- Zabbix Metrics Collection: Collect key metrics (CPU, memory, disk, network) from Zabbix API for each client and store them in PostgreSQL and Redis.
- Real-time Dashboard: Display real-time graphs and alerts for key metrics using Chart.js, with WebSocket integration for live updates.
- AI-Powered Querying: Enable users to ask questions in natural language about their Zabbix data, using the Gemini API tool to interpret queries and fetch relevant data from PostgreSQL/Redis.
- Real-time Streaming: Stream metric updates and AI responses in real-time via WebSockets, providing immediate feedback to the user.
- User Authentication: Implement secure user authentication via Firebase Auth.

## Style Guidelines:

- Primary color: A saturated blue (#2979FF) to represent technology and stability.
- Background color: A light blue (#E3F2FD) to maintain a clean and professional look.
- Accent color: A vibrant orange (#FF9100) for alerts and interactive elements, creating a clear visual hierarchy.
- Body and headline font: 'Inter' sans-serif font for a modern, machined, objective, and neutral look; suitable for both headlines and body text.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use consistent, clear icons to represent different metrics and functions, ensuring quick comprehension.
- Employ a clean, well-organized layout that facilitates easy navigation and data visualization.
- Incorporate subtle animations for data updates and loading states, enhancing the user experience.