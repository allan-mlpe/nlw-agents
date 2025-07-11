import { useQuery } from '@tanstack/react-query';
import type { GetRoomsResponse } from './types/use-rooms';

export function useRooms() {
    return useQuery({
        queryKey: ['get-rooms'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3333/rooms')
            const result: GetRoomsResponse = await response.json()

            return result
        },
    })
}