import React from 'react';
import { connect, MqttClient } from 'mqtt';

const MQTT_URI = 'wss://meri.digitraffic.fi:443/mqtt';
const MQTT_LOCATION_TOPIC = 'vessels-v2/+/location';
const MQTT_METADATA_TOPIC = 'vessels-v2/+/metadata';

type VesselMetadataRecord = {
  timestamp: number;
  destination: string | null;
  name: string | null;
  draught: number;
  eta: number;
  posType: number;
  refA: number;
  refB: number;
  refC: number;
  refD: number;
  callSign: string;
  imo: number;
  type: number;
  raw: Record<string, unknown>;
};

type VesselStreamRecord = {
  mmsi: string;
  topic: string;
  timestamp: string;
  sog: number;
  cog: number;
  navStat: number;
  rot: number;
  posAcc: boolean;
  raim: boolean;
  heading: number;
  lon: number;
  lat: number;
  receivedAt: number;
  raw: Record<string, unknown>;
  metadata?: VesselMetadataRecord;
};

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

type VesselMqttContextType = {
  status: ConnectionStatus;
  error?: string | null;
  vessels: Record<string, VesselStreamRecord>;
  vesselList: VesselStreamRecord[];
  metadata: Record<string, VesselMetadataRecord>;
  metadataList: VesselMetadataRecord[];
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
  const [metadataRecords, setMetadataRecords] = React.useState<Record<string, VesselMetadataRecord>>({});
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

    const subscribeToTopics = () => {
      client.subscribe([MQTT_LOCATION_TOPIC, MQTT_METADATA_TOPIC], { qos: 0 }, err => {
        if (err) {
          console.log('[mqtt] subscribe error', err?.message ?? err);
          setError(err?.message ?? 'Subscription failed');
          return;
        }
        console.log('[mqtt] subscribed to vessel topics');
      });
    };

    client.on('connect', () => {
      if (!isMounted) {
        return;
      }
      console.log('[mqtt] connected');
      setStatus('connected');
      setError(null);
      subscribeToTopics();
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
        const isLocationTopic = topic.includes('/location');
        const isMetadataTopic = topic.includes('/metadata');

        if (!isLocationTopic && !isMetadataTopic) {
          return;
        }

        if (isLocationTopic) {
          setVessels(prev => {
            const existing = prev[mmsi];
            const updated: VesselStreamRecord = {
              ...(existing ?? {
                mmsi,
                topic,
                receivedAt: Date.now(),
                raw: {},
              }),
              mmsi,
              topic,
              lat: parsed.lat,
              lon: parsed.lon,
              heading: parsed.heading,
              sog: parsed.sog,
              cog: parsed.cog,
              navStat: parsed.navStat,
              rot: parsed.rot,
              posAcc: parsed.posAcc,
              raim: parsed.raim,
              receivedAt: Date.now(),
              raw: parsed,
              metadata: existing?.metadata,
            };

            return {
              ...prev,
              [mmsi]: updated,
            };
          });
        } else if (isMetadataTopic) {
          const metadataRecord: VesselMetadataRecord = {
            timestamp: parsed.timestamp,
            destination: parsed.destination,
            name: parsed.name,
            draught: parsed.draught,
            eta: parsed.eta,
            posType: parsed.posType,
            refA: parsed.refA,
            refB: parsed.refB,
            refC: parsed.refC,
            refD: parsed.refD,
            callSign: parsed.callSign,
            imo: parsed.imo,
            type: parsed.type,
            raw: parsed,
          };

          setMetadataRecords(prev => ({
            ...prev,
            [mmsi]: metadataRecord,
          }));

          setVessels(prev => {
            const existing = prev[mmsi];
            const updated: VesselStreamRecord = {
              ...(existing ?? {
                mmsi,
                topic,
                receivedAt: Date.now(),
                raw: {},
              }),
              metadata: metadataRecord,
            };

            return {
              ...prev,
              [mmsi]: updated,
            };
          });
        }
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
  const metadataList = React.useMemo(() => Object.values(metadataRecords), [metadataRecords]);

  return (
    <VesselMqttContext.Provider
      value={{
        status,
        error,
        vessels,
        vesselList,
        metadata: metadataRecords,
        metadataList,
      }}
    >
      {children}
    </VesselMqttContext.Provider>
  );
};
