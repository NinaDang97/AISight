import { GeoJSONSourceSpecification } from "@maplibre/maplibre-gl-style-spec";
import { ShapeSource } from "@maplibre/maplibre-react-native";

const AttributionSource = () => {
  const attributionShape: GeoJSON.Feature = {
    type: 'geojson',
    data: {
      'type': 'FeatureCollection',
      'features': []
    },
    attribution: 'Your custom attribution'
  };
    
    return <ShapeSource id="attribution" shape={attributionShape} attribution=/>

export default AttributionSource;