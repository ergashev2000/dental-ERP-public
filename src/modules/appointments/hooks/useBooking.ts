import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { bookingApi } from '../api/bookingApi';
import type { SuggestQuery, WaitlistInput } from '../types';

/** Aqlli vaqt takliflari — xizmat tanlangandan keyin ishlaydi */
export const useSuggestSlots = (q: SuggestQuery, enabled = true) =>
  useQuery({
    queryKey: [...K.appointments, 'suggest', q],
    queryFn: () => bookingApi.suggest(q),
    enabled: enabled && q.serviceIds.length > 0,
    placeholderData: keepPreviousData,
  });

export const useWaitlist = () => useQuery({ queryKey: K.waitlist, queryFn: bookingApi.waitlist });

export const useAddWaitlist = () =>
  useMutation({ mutationFn: (input: WaitlistInput) => bookingApi.addWaitlist(input), onSuccess: () => invalidate(K.waitlist) });

export const useResolveWaitlist = () =>
  useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'BOOKED' | 'REMOVED' }) => bookingApi.resolveWaitlist(id, status),
    onSuccess: () => invalidate(K.waitlist),
  });

export const useOnlineRequests = () => useQuery({ queryKey: K.online, queryFn: bookingApi.online, refetchInterval: 60_000 });

export const useResolveOnline = () =>
  useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'DECLINED' }) => bookingApi.resolveOnline(id, status),
    onSuccess: () => invalidate(K.online),
  });
