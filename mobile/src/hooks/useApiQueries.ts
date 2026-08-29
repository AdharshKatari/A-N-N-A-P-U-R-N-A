import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, DashboardStats, Batch, BatchCreateRequest, EnvironmentalLogRequest, Notification, PestScan } from '../lib/apiClient';

// Dashboard
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.get(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Batches
export function useBatches(params?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['batches', params],
    queryFn: () => api.batches.list(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useBatch(batchId: string) {
  return useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => api.batches.get(batchId),
    enabled: !!batchId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchCreateRequest) => api.batches.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, newStatus }: { batchId: string; newStatus: string }) =>
      api.batches.updateStatus(batchId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => api.batches.delete(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Environmental Logs
export function useEnvironmentalLogs(batchId: string, limit = 100) {
  return useQuery({
    queryKey: ['logs', batchId, limit],
    queryFn: () => api.logs.list(batchId, limit),
    enabled: !!batchId,
    staleTime: 1000 * 60 * 1,
  });
}

export function useLogAnalytics(batchId: string) {
  return useQuery({
    queryKey: ['logs', 'analytics', batchId],
    queryFn: () => api.logs.analytics(batchId),
    enabled: !!batchId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EnvironmentalLogRequest) => api.logs.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['logs', variables.batch_id] });
      queryClient.invalidateQueries({ queryKey: ['logs', 'analytics', variables.batch_id] });
    },
  });
}

// Salvage Facilities
export function useNearbySalvageFacilities(latitude: number, longitude: number, radiusKm = 50, limit = 5) {
  return useQuery({
    queryKey: ['salvage', 'nearby', latitude, longitude, radiusKm],
    queryFn: () => api.salvage.nearby(latitude, longitude, radiusKm, limit),
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 10,
  });
}

// Mandi Prices
export function useMandiPrices(crop: string, state?: string) {
  return useQuery({
    queryKey: ['mandi', 'prices', crop, state],
    queryFn: () => api.mandi.prices(crop, state),
    enabled: !!crop,
    staleTime: 1000 * 60 * 10,
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    staleTime: 1000 * 60 * 2,
  });
}

// Scans
export function useScans() {
  return useQuery({
    queryKey: ['scans'],
    queryFn: () => api.scans.list(),
    staleTime: 1000 * 60 * 5,
  });
}

// Health
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.health(),
    staleTime: 1000 * 60 * 1,
  });
}