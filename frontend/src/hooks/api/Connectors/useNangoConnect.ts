import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConnectUI } from '@nangohq/frontend';
import { useNangoSession, useNangoConnections } from '@/hooks/api/Connectors';

export function useNangoConnect() {
  const { mutateAsync: createSession } = useNangoSession();
  const queryClient = useQueryClient();
  const { data: existingConnections } = useNangoConnections();
  const existingIdsRef = useRef<Set<string>>(new Set());
  const [isPending, setIsPending] = useState(false);

  const connect = useCallback(
    async (integrationId: string, onCreated?: (connectionId: string) => void) => {
      try {
        setIsPending(true);

        // Snapshot current connection IDs before OAuth
        existingIdsRef.current = new Set(
          (existingConnections || []).map((c) => c.id),
        );

        const { session_token } = await createSession(integrationId);
        const connectUI = new ConnectUI({
          sessionToken: session_token,
          onEvent: (event) => {
            if (event.type === 'close') {
              setIsPending(false);
            }
            if (event.type === 'connect') {
              // Webhook is async — poll until the connection appears in the DB
              const pollForConnection = (attempts = 0) => {
                setTimeout(async () => {
                  await queryClient.invalidateQueries({
                    queryKey: ['connectors', 'nango', 'connections'],
                  });

                  const data = queryClient.getQueryData<Array<{ id: string }>>(
                    ['connectors', 'nango', 'connections'],
                  );
                  if (data && onCreated) {
                    const newConn = data.find(
                      (c) => !existingIdsRef.current.has(c.id),
                    );
                    if (newConn) {
                      setIsPending(false);
                      onCreated(newConn.id);
                      return;
                    }
                  }

                  if (attempts < 5) {
                    pollForConnection(attempts + 1);
                  } else {
                    setIsPending(false);
                  }
                }, attempts === 0 ? 1500 : 3000);
              };
              pollForConnection();
            }
          },
        });
        connectUI.open();
      } catch (err) {
        console.error('Failed to open Nango Connect UI:', err);
        setIsPending(false);
      }
    },
    [createSession, queryClient, existingConnections],
  );

  return { connect, isPending };
}
