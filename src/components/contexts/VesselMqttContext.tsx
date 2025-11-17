import React from 'react';
import { connect, MqttClient } from 'mqtt';

const MQTT_URI = 'wss://meri.digitraffic.fi:443/mqtt';
const MQTT_TOPIC = 'vessels-v2/+/location';
// const MQTT_TOPIC = 'vessels-v2/230040000/location'

type VesselStreamRecord = {
  mmsi: string;
  topic: string;
  lat: number;
  lon: number;
  heading?: number | null;
  sog?: number | null;
  cog?: number | null;
  navStat?: number | null;
  posAcc?: boolean;
  raim?: boolean;
  receivedAt: number;
  reportedAt?: number;
  raw: Record<string, unknown>;
};

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

type VesselMqttContextType = {
  status: ConnectionStatus;
  error?: string | null;
  vessels: Record<string, VesselStreamRecord>;
  vesselList: VesselStreamRecord[];
};

const VesselMqttContext = React.createContext<VesselMqttContextType | undefined>(undefined);

export const useVesselMqtt = (): VesselMqttContextType => {
  const context = React.useContext(VesselMqttContext);
  if (!context) {
    throw new Error('useVesselMqtt must be used within a VesselMqttProvider');
  }
  return context;
};

export const VesselMqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = React.useState<ConnectionStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [vessels, setVessels] = React.useState<Record<string, VesselStreamRecord>>({});
  const clientRef = React.useRef<MqttClient | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    setStatus('connecting');

    const clientId = `AISightVessels-${Date.now()}`;
    const client = connect(MQTT_URI, {
      clientId,
      reconnectPeriod: 5000,
      connectTimeout: 30_000,
      clean: true,
    });

    clientRef.current = client;

    const subscribeToTopic = () => {
      client.subscribe(MQTT_TOPIC, { qos: 0 }, err => {
        if (err) {
          console.log('[mqtt] subscribe error', err?.message ?? err);
          setError(err?.message ?? 'Subscription failed');
          return;
        }
        console.log('[mqtt] subscribed to vessels topic');
      });
    };

    client.on('connect', () => {
      if (!isMounted) {
        return;
      }
      console.log('[mqtt] connected');
      setStatus('connected');
      setError(null);
      subscribeToTopic();
    });

    client.on('reconnect', () => {
      if (!isMounted) {
        return;
      }
      console.log('[mqtt] reconnecting');
      setStatus('reconnecting');
    });

    client.on('close', () => {
      if (!isMounted) {
        return;
      }
      console.log('[mqtt] connection closed');
      setStatus(prev => (prev === 'error' ? 'error' : 'idle'));
    });

    client.on('error', err => {
      console.log('[mqtt] error', err?.message ?? err);
      if (!isMounted) {
        return;
      }
      setError(err?.message ?? 'Unknown MQTT error');
      setStatus('error');
    });

    client.on('message', (topic, payload) => {
      if (!isMounted) {
        return;
      }

      const [, mmsi] = topic.split('/');
      if (!mmsi) {
        return;
      }

      try {
        const parsed = JSON.parse(payload.toString());
        setVessels(prev => ({
          ...prev,
          [mmsi]: {
            mmsi,
            topic,
            lat: parsed.lat,
            lon: parsed.lon,
            heading: parsed.heading ?? null,
            sog: parsed.sog ?? null,
            cog: parsed.cog ?? null,
            navStat: parsed.navStat ?? null,
            posAcc: parsed.posAcc ?? null,
            raim: parsed.raim ?? null,
            reportedAt: typeof parsed.time === 'number' ? parsed.time : undefined,
            receivedAt: Date.now(),
            raw: parsed,
          },
        }));
      } catch (err) {
        console.log('[mqtt] failed to parse message', err);
      }
    });

    return () => {
      isMounted = false;
      client.removeAllListeners();
      client.end(true);
      clientRef.current = null;
    };
  }, []);

  const vesselList = React.useMemo(() => Object.values(vessels), [vessels]);

  return (
    <VesselMqttContext.Provider
      value={{
        status,
        error,
        vessels,
        vesselList,
      }}
    >
      {children}
    </VesselMqttContext.Provider>
  );
};
