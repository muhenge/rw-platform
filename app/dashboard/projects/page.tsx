// app/dashboard/projects/page.tsx
import { ProjectForm } from './components/ProjectForm';
import { apiClient } from '@/lib/axiosInstance';

export default async function ProjectsPage() {
  // Fetch initial data on the server
  const [clientsResponse, usersResponse] = await Promise.allSettled([
    apiClient.get('/clients/all'),
    apiClient.get('/users/all')
  ]);

  const initialClients = clientsResponse.status === 'fulfilled' ? clientsResponse.value.data : [];
  const initialUsers = usersResponse.status === 'fulfilled' ? usersResponse.value.data : [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <ProjectForm
          initialClients={initialClients}
          initialUsers={initialUsers}
        />
      </div>

      {/* Projects list would go here */}
    </div>
  );
}
