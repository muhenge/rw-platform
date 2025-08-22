// ProjectForm.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Pencil, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient } from "@/lib/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { debounce } from "lodash";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { toast } from 'sonner';
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from '@/components/ui/popover';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
// Types
type Client = { id: string; name: string };
type User = { id: string; firstName: string; lastName: string; email: string };
interface ClientItem extends Client {
  isNew?: boolean;
}

type ProjectResponse = {
  id: string;
  name: string;
  description: string;
  code: string;
  status: string;
  startDate: string;
  endDate: string | null;
  budget: number | null;
  clientId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    // ... other user fields
  }>;
  client: {
    id: string;
    name: string;
    // ... other client fields
  };
};

// Update the ProjectForm component props to include onSuccess callback
interface ProjectFormProps {
  initialClients?: Client[];
  initialUsers?: User[];
  project?: ProjectResponse | null; // Add project prop for edit mode
  onSuccess?: (project: ProjectResponse) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  showTrigger?: boolean; // Add mode prop to differentiate between create and edit
}

// Form Schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().optional(),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date().optional(),
  budget: z.coerce.number().min(0, { message: "Budget must be a positive number." }).optional(),
  clientId: z.string({ required_error: "Please select a client." }),
  memberIds: z.array(z.string()).min(1, { message: "Please select at least one team member." }),
});

// Props type
interface ProjectFormProps {
  initialClients?: Client[];
  initialUsers?: User[];
  project?: ProjectResponse | null; // Add project prop for edit mode
  onSuccess?: (project: ProjectResponse) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  showTrigger?: boolean;
}

export function ProjectForm({
  initialClients = [],
  initialUsers = [],
  project = null,
  onSuccess,
  onCancel,
  mode = 'create',
  showTrigger = true,
}: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const queryClient = useQueryClient();

  // Form setup with default values from project if in edit mode
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      startDate: project?.startDate ? new Date(project.startDate) : undefined,
      endDate: project?.endDate ? new Date(project.endDate) : undefined,
      budget: project?.budget || undefined,
      clientId: project?.clientId || "",
      memberIds: project?.members?.map(member => member.id) || [],
    },
  });

  type ProjectResponse = {
    id: string;
    name: string;
    description: string;
    code: string;
    status: string;
    startDate: string;
    endDate: string | null;
    budget: number | null;
    clientId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    members: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      // ... other user fields
    }>;
    client: {
      id: string;
      name: string;
      // ... other client fields
    };
  };

  // add project


  //add client

  const addClientMutation = useMutation<Client, unknown, NewClientPayload>({
    mutationKey: ['clients', 'create'],
    mutationFn: async (newClient) => {
      const res = await apiClient.post('/clients', newClient);
      return res.data as Client;
    },
    onSuccess: (createdClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      setClientSearch('');

      form.setValue('clientId', createdClient.id);
    },
  });


  const newClientSchema = z.object({
    name: z.string().min(2, "Client name must be at least 2 characters"),
  });


  const addClientForm = useForm({
    resolver: zodResolver(newClientSchema),
    defaultValues: { name: "" },
  });


  // Fetch clients with search
  const { data: clients = initialClients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients', searchQuery],
    queryFn: async () => {
      const response = await apiClient.get('/user/clients/search', {
        params: { query: searchQuery }
      });
      return response.data.data;
    },
    //initialData: initialClients,
    //enabled: isSearching || searchQuery.length > 0,
    //keepPreviousData: true,
  });


  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setIsSearching(true);
    }, 300),
    []
  );

  // Load users (no search for now, but could be added similarly)
  const { data: users = initialUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/user/all');
      return response.data.data;
    },
    //initialData: initialUsers,
    //staleTime: 5 * 60 * 1000,
  }
  );

  // Cleanup debounce
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const updateProjectMutation = useMutation<ProjectResponse, Error, { id: string; data: z.infer<typeof formSchema> }>({
    mutationFn: async ({ id, data }) => {
      try {
        const response = await apiClient.patch(`/post/projects/${id}`, {
          name: data.name,
          description: data.description,
          clientId: data.clientId,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate?.toISOString(),
          memberIds: data.memberIds,
        });
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update project';
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      toast.success('Project updated successfully!', {
        description: `${data.name} has been updated.`,
      });

      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Reset the form
      form.reset({
        name: '',
        description: '',
        startDate: undefined,
        endDate: undefined,
        budget: undefined,
        clientId: '',
        memberIds: [],
      });

      if (onSuccess) {
        onSuccess(data);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }

      if (onCancel) {
        onCancel();
      }
    },
    onError: (error) => {
      toast.error('Failed to update project', {
        description: error.message,
      });
    },
  });

  const createProjectMutation = useMutation<ProjectResponse, Error, z.infer<typeof formSchema>>({
    mutationFn: async (data) => {
      try {
        const response = await apiClient.post('/post/projects', {
          name: data.name,
          description: data.description,
          clientId: data.clientId,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate?.toISOString(),
          memberIds: data.memberIds,
        });
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create project';
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      toast.success('Project created successfully!', {
        description: `${data.name} has been created.`,
      });

      // Invalidate both queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });

      // Reset the form
      form.reset({
        name: '',
        description: '',
        startDate: undefined,
        endDate: undefined,
        budget: undefined,
        clientId: '',
        memberIds: [],
      });

      if (onSuccess) {
        onSuccess(data);
      }

      if (onCancel) {
        onCancel();
      }
    },
    onError: (error) => {
      toast.error('Failed to create project', {
        description: error.message,
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (mode === 'edit' && project) {
        await updateProjectMutation.mutateAsync({ id: project.id, data });
      } else {
        await createProjectMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error('Error in form submission:', error);
    }
  };

  // Delete project utation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiClient.delete(`/post/projects/${id}`);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete project';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (onCancel) {
        onCancel();
      }
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to delete project', {
        description: error.message,
      });
    },
  });

  const handleDelete = () => {
    if (project && window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  // Update dialog title based on mode
  const dialogTitle = mode === 'edit' ? 'Edit Project' : 'Create New Project';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && ( // Only show the trigger if showTrigger is true
        mode === 'create' ? (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        )
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor 
                      value={field.value || ''} 
                      onChange={field.onChange}
                      placeholder="Enter project description..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client Selection with Search */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => {
                const [clientSearch, setClientSearch] = useState("");
                const [open, setOpen] = useState(false);

                // Filter clients based on search
                const filteredClients = useMemo(() => {
                  if (!clientSearch) return clients;
                  return clients.filter(client =>
                    client.name.toLowerCase().includes(clientSearch.toLowerCase())
                  );
                }, [clients, clientSearch]);

                // Handle adding a new client
                const handleAddClient = async () => {
                  if (!clientSearch.trim()) return;

                  try {
                    const response = await apiClient.post('/user/clients', {
                      name: clientSearch.trim()
                    });
                    const newClient = response.data;

                    // Update the form with the new client
                    form.setValue("clientId", newClient.id);
                    setClientSearch("");
                    setOpen(false);

                    // Invalidate clients query to refetch the list
                    queryClient.invalidateQueries({ queryKey: ['clients'] });

                    toast.success(`Client "${newClient.name}" added successfully`);
                  } catch (error) {
                    console.error('Error adding client:', error);
                    toast.error('Failed to add client. Please try again.');
                  }
                };

                // Check if we should show the "Add new client" option
                const showAddClient = clientSearch &&
                  !filteredClients.some(c => c.name.toLowerCase() === clientSearch.toLowerCase());

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Lead</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? clients.find((client) => client.id === field.value)?.name
                              : "Select project Lead  ..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              placeholder="Search project Leads..."
                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              value={clientSearch}
                              onChange={(e) => setClientSearch(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && showAddClient) {
                                  e.preventDefault();
                                  handleAddClient();
                                }
                              }}
                            />
                          </div>
                          <CommandEmpty>
                            <div className="p-2 text-center text-sm">
                              No Lead found. Press Enter to add "{clientSearch}" as a new Lead.
                            </div>
                          </CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {filteredClients.map((client) => (
                              <CommandItem
                                value={client.name}
                                key={client.id}
                                onSelect={() => {
                                  form.setValue("clientId", client.id);
                                  setOpen(false);
                                  setClientSearch("");
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === client.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {client.name}
                              </CommandItem>
                            ))}
                            {showAddClient && (
                              <CommandItem
                                className="text-primary font-medium cursor-pointer"
                                onSelect={handleAddClient}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add "{clientSearch}" as new Lead
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Team Members */}
            <FormField
              control={form.control}
              name="memberIds"
              render={({ field }) => {
                const [search, setSearch] = useState("");

                // Filter users based on search
                const filteredUsers = useMemo(() => {
                  if (!search) return users;
                  return users.filter(user =>
                    `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                    user.email.toLowerCase().includes(search.toLowerCase())
                  );
                }, [users, search]);

                return (
                  <FormItem>
                    <FormLabel>Team Members</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value?.length && "text-muted-foreground"
                            )}
                          >
                            {field.value?.length
                              ? `${field.value.length} team member${field.value.length > 1 ? 's' : ''} selected`
                              : "Select team members..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search team members..."
                            value={search}
                            onValueChange={setSearch}
                          />
                          <CommandEmpty>No team members found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {filteredUsers.map((user) => {
                              const isSelected = field.value?.includes(user.id);
                              return (
                                <CommandItem
                                  value={`${user.firstName} ${user.lastName}`}
                                  key={user.id}
                                  onSelect={() => {
                                    const newValue = isSelected
                                      ? field.value?.filter((id) => id !== user.id)
                                      : [...(field.value || []), user.id];
                                    field.onChange(newValue);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible"
                                  )}>
                                    <Check className={cn("h-4 w-4")} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span>{user.firstName} {user.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                    {field.value?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {field.value.map((userId) => {
                          const user = users.find(u => u.id === userId);
                          if (!user) return null;
                          return (
                            <div
                              key={userId}
                              className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
                            >
                              <span>{user.firstName} {user.lastName}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  field.onChange(field.value.filter(id => id !== userId));
                                }}
                                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                              >
                                <div className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </FormItem>
                );
              }}
            />

            {/* Other form fields... */}

            <DialogFooter className="sm:justify-between">
              {mode === 'edit' && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteProjectMutation.isPending}
                >
                  {deleteProjectMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Project
                </Button>
              )}
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    if (onCancel) onCancel();
                    else setOpen(false);
                  }}
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  className="min-w-[120px]"
                >
                  {createProjectMutation.isPending || updateProjectMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {mode === 'edit' ? 'Save Changes' : 'Create Project'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
